import crypto from 'crypto';
import prisma, { isDatabaseConfigured } from '../config/db';
import { CustomerAddress, CreateAddressInput, UpdateAddressInput, AddressType } from '../types/address';
import serviceabilityService from './serviceabilityService';

export class AddressService {
  // In-memory address store for fallback and fast cache
  private inMemoryAddresses: Map<string, CustomerAddress> = new Map();

  constructor() {
    this.seedDefaultAddresses();
  }

  private seedDefaultAddresses() {
    const sarahId = 'demo-user-cust-sarah';

    const campusAddress: CustomerAddress = {
      id: 'addr-sarah-campus-1',
      userId: sarahId,
      fullName: 'Sarah Mehta',
      phoneNumber: '+91 97777 22222',
      houseFlatBuilding: 'Hostel Block A, Room 204',
      streetArea: 'North Campus Road',
      landmark: 'Near Gate 2 Security Desk',
      postalCode: '560092',
      city: 'Bengaluru',
      state: 'Karnataka',
      addressType: 'Hostel',
      isDefault: true,
      deliveryInstructions: 'Leave on hostel reception drop table',
      latitude: 13.0827,
      longitude: 77.5877,
      isServiceable: true,
      serviceableZone: 'campus',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const homeAddress: CustomerAddress = {
      id: 'addr-sarah-home-1',
      userId: sarahId,
      fullName: 'Sarah Mehta',
      phoneNumber: '+91 97777 22222',
      houseFlatBuilding: 'Flat 302, Green Meadows Apartments',
      streetArea: '12th Main Road, HAL 2nd Stage, Indiranagar',
      landmark: 'Opposite Defense Colony Park',
      postalCode: '560038',
      city: 'Bengaluru',
      state: 'Karnataka',
      addressType: 'Home',
      isDefault: false,
      deliveryInstructions: 'Ring doorbell 302, leave with security if unavailable',
      latitude: 12.9716,
      longitude: 77.6412,
      isServiceable: true,
      serviceableZone: 'metro_city',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.inMemoryAddresses.set(campusAddress.id, campusAddress);
    this.inMemoryAddresses.set(homeAddress.id, homeAddress);
  }

  /**
   * Helper to normalize user ID for demo accounts
   */
  public resolveUserId(userId: string): string {
    if (userId === 'cust-sarah' || userId === 'user-sarah') return 'demo-user-cust-sarah';
    if (userId === 'cust-alice') return 'demo-user-cust-alice';
    if (userId === 'cust-bob') return 'demo-user-cust-bob';
    return userId;
  }

  /**
   * Get all addresses for a customer, with default address first
   */
  public async getAddresses(userId: string): Promise<CustomerAddress[]> {
    const resolvedUserId = this.resolveUserId(userId);

    // Try Prisma DB first
    if (isDatabaseConfigured()) {
      try {
        const dbAddresses = await prisma.address.findMany({
          where: { userId: resolvedUserId },
          orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
        });

        if (dbAddresses && dbAddresses.length > 0) {
          return dbAddresses.map((a: any) => this.mapPrismaToAddress(a));
        }
      } catch (err) {
        console.warn('[AddressService] Database fetch error, falling back to memory:', (err as Error).message);
      }
    }

    // In-memory fallback
    const userAddresses = Array.from(this.inMemoryAddresses.values()).filter(
      (a) => a.userId === resolvedUserId || a.userId === userId
    );

    return userAddresses.sort((a, b) => {
      if (a.isDefault && !b.isDefault) return -1;
      if (!a.isDefault && b.isDefault) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  /**
   * Get a specific address by ID (with authorization check)
   */
  public async getAddressById(userId: string, addressId: string): Promise<CustomerAddress | null> {
    const resolvedUserId = this.resolveUserId(userId);

    if (isDatabaseConfigured()) {
      try {
        const found = await prisma.address.findUnique({
          where: { id: addressId },
        });

        if (found) {
          if (found.userId !== resolvedUserId && found.userId !== userId) {
            const err = new Error('Access denied: You do not have permission to view this address.');
            (err as any).statusCode = 403;
            throw err;
          }
          return this.mapPrismaToAddress(found);
        }
      } catch (err: any) {
        if (err.statusCode === 403) throw err;
        console.warn('[AddressService] DB lookup fallback:', err.message);
      }
    }

    const mem = this.inMemoryAddresses.get(addressId);
    if (!mem) return null;

    if (mem.userId !== resolvedUserId && mem.userId !== userId) {
      const err = new Error('Access denied: You do not have permission to view this address.');
      (err as any).statusCode = 403;
      throw err;
    }

    return mem;
  }

  /**
   * Add a new delivery address for the customer
   */
  public async createAddress(userId: string, input: CreateAddressInput): Promise<CustomerAddress> {
    const resolvedUserId = this.resolveUserId(userId);

    // 1. Evaluate serviceability
    const fullText = `${input.houseFlatBuilding} ${input.streetArea} ${input.landmark || ''}`;
    const serviceability = serviceabilityService.evaluateServiceability(
      input.postalCode,
      input.city,
      fullText,
      input.latitude,
      input.longitude
    );

    // 2. Determine default status: if user has no existing addresses, make this default
    const existing = await this.getAddresses(resolvedUserId);
    const shouldBeDefault = input.isDefault || existing.length === 0;

    const id = `addr-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const nowIso = new Date().toISOString();

    const newAddress: CustomerAddress = {
      id,
      userId: resolvedUserId,
      fullName: input.fullName.trim(),
      phoneNumber: input.phoneNumber.trim(),
      houseFlatBuilding: input.houseFlatBuilding.trim(),
      streetArea: input.streetArea.trim(),
      landmark: input.landmark?.trim() || undefined,
      postalCode: input.postalCode.trim(),
      city: input.city.trim(),
      state: input.state.trim(),
      addressType: (input.addressType as AddressType) || 'Home',
      isDefault: shouldBeDefault,
      deliveryInstructions: input.deliveryInstructions?.trim() || undefined,
      latitude: input.latitude,
      longitude: input.longitude,
      isServiceable: serviceability.isServiceable,
      serviceableZone: serviceability.zone,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    // If making default, unset other addresses
    if (shouldBeDefault) {
      await this.unsetOtherDefaults(resolvedUserId);
    }

    // Persist in Prisma if connected
    if (isDatabaseConfigured()) {
      try {
        await prisma.address.create({
          data: {
            id: newAddress.id,
            userId: resolvedUserId,
            fullName: newAddress.fullName,
            phoneNumber: newAddress.phoneNumber,
            houseFlatBuilding: newAddress.houseFlatBuilding,
            streetArea: newAddress.streetArea,
            landmark: newAddress.landmark,
            postalCode: newAddress.postalCode,
            city: newAddress.city,
            state: newAddress.state,
            addressType: newAddress.addressType,
            isDefault: newAddress.isDefault,
            deliveryInstructions: newAddress.deliveryInstructions,
            latitude: newAddress.latitude !== undefined ? newAddress.latitude : null,
            longitude: newAddress.longitude !== undefined ? newAddress.longitude : null,
            isServiceable: newAddress.isServiceable,
          },
        });
      } catch (err) {
        console.warn('[AddressService] Database insert error, cached in memory:', (err as Error).message);
      }
    }

    this.inMemoryAddresses.set(newAddress.id, newAddress);
    return newAddress;
  }

  /**
   * Update an existing delivery address
   */
  public async updateAddress(
    userId: string,
    addressId: string,
    input: UpdateAddressInput
  ): Promise<CustomerAddress> {
    const resolvedUserId = this.resolveUserId(userId);
    const existing = await this.getAddressById(resolvedUserId, addressId);

    if (!existing) {
      const err = new Error(`Address with ID '${addressId}' not found.`);
      (err as any).statusCode = 404;
      throw err;
    }

    // Re-evaluate serviceability if PIN or address fields changed
    const updatedPostalCode = input.postalCode ? input.postalCode.trim() : existing.postalCode;
    const updatedCity = input.city ? input.city.trim() : existing.city;
    const updatedBuilding = input.houseFlatBuilding ? input.houseFlatBuilding.trim() : existing.houseFlatBuilding;
    const updatedStreet = input.streetArea ? input.streetArea.trim() : existing.streetArea;
    const updatedLandmark = input.landmark !== undefined ? input.landmark.trim() : existing.landmark;

    const fullText = `${updatedBuilding} ${updatedStreet} ${updatedLandmark || ''}`;
    const serviceability = serviceabilityService.evaluateServiceability(
      updatedPostalCode,
      updatedCity,
      fullText,
      input.latitude !== undefined ? input.latitude : existing.latitude,
      input.longitude !== undefined ? input.longitude : existing.longitude
    );

    const nowIso = new Date().toISOString();
    const shouldBeDefault = input.isDefault !== undefined ? input.isDefault : existing.isDefault;

    if (shouldBeDefault && !existing.isDefault) {
      await this.unsetOtherDefaults(resolvedUserId, addressId);
    }

    const updatedAddress: CustomerAddress = {
      ...existing,
      fullName: input.fullName !== undefined ? input.fullName.trim() : existing.fullName,
      phoneNumber: input.phoneNumber !== undefined ? input.phoneNumber.trim() : existing.phoneNumber,
      houseFlatBuilding: updatedBuilding,
      streetArea: updatedStreet,
      landmark: updatedLandmark,
      postalCode: updatedPostalCode,
      city: updatedCity,
      state: input.state !== undefined ? input.state.trim() : existing.state,
      addressType: (input.addressType as AddressType) || existing.addressType,
      isDefault: shouldBeDefault,
      deliveryInstructions:
        input.deliveryInstructions !== undefined
          ? input.deliveryInstructions.trim()
          : existing.deliveryInstructions,
      latitude: input.latitude !== undefined ? input.latitude : existing.latitude,
      longitude: input.longitude !== undefined ? input.longitude : existing.longitude,
      isServiceable: serviceability.isServiceable,
      serviceableZone: serviceability.zone,
      updatedAt: nowIso,
    };

    if (isDatabaseConfigured()) {
      try {
        await prisma.address.update({
          where: { id: addressId },
          data: {
            fullName: updatedAddress.fullName,
            phoneNumber: updatedAddress.phoneNumber,
            houseFlatBuilding: updatedAddress.houseFlatBuilding,
            streetArea: updatedAddress.streetArea,
            landmark: updatedAddress.landmark,
            postalCode: updatedAddress.postalCode,
            city: updatedAddress.city,
            state: updatedAddress.state,
            addressType: updatedAddress.addressType,
            isDefault: updatedAddress.isDefault,
            deliveryInstructions: updatedAddress.deliveryInstructions,
            latitude: updatedAddress.latitude !== undefined ? updatedAddress.latitude : null,
            longitude: updatedAddress.longitude !== undefined ? updatedAddress.longitude : null,
            isServiceable: updatedAddress.isServiceable,
          },
        });
      } catch (err) {
        console.warn('[AddressService] DB update error, memory updated:', (err as Error).message);
      }
    }

    this.inMemoryAddresses.set(updatedAddress.id, updatedAddress);
    return updatedAddress;
  }

  /**
   * Delete an address with ownership check
   */
  public async deleteAddress(userId: string, addressId: string): Promise<boolean> {
    const resolvedUserId = this.resolveUserId(userId);
    const existing = await this.getAddressById(resolvedUserId, addressId);

    if (!existing) {
      const err = new Error(`Address with ID '${addressId}' not found.`);
      (err as any).statusCode = 404;
      throw err;
    }

    const wasDefault = existing.isDefault;

    if (isDatabaseConfigured()) {
      try {
        await prisma.address.delete({
          where: { id: addressId },
        });
      } catch (err) {
        console.warn('[AddressService] DB delete error:', (err as Error).message);
      }
    }

    this.inMemoryAddresses.delete(addressId);

    // If deleted address was default, promote remaining address to default
    if (wasDefault) {
      const remaining = await this.getAddresses(resolvedUserId);
      if (remaining.length > 0) {
        await this.setDefaultAddress(resolvedUserId, remaining[0].id);
      }
    }

    return true;
  }

  /**
   * Set a specific address as the default for the customer
   */
  public async setDefaultAddress(userId: string, addressId: string): Promise<CustomerAddress> {
    const resolvedUserId = this.resolveUserId(userId);
    const existing = await this.getAddressById(resolvedUserId, addressId);

    if (!existing) {
      const err = new Error(`Address with ID '${addressId}' not found.`);
      (err as any).statusCode = 404;
      throw err;
    }

    // Unset all other defaults
    await this.unsetOtherDefaults(resolvedUserId, addressId);

    return this.updateAddress(resolvedUserId, addressId, { isDefault: true });
  }

  /**
   * Helper to unset default status on other addresses
   */
  private async unsetOtherDefaults(userId: string, excludeAddressId?: string) {
    if (isDatabaseConfigured()) {
      try {
        await prisma.address.updateMany({
          where: {
            userId,
            id: excludeAddressId ? { not: excludeAddressId } : undefined,
            isDefault: true,
          },
          data: { isDefault: false },
        });
      } catch (err) {
        console.warn('[AddressService] Unset defaults DB error:', (err as Error).message);
      }
    }

    // In-memory unset
    for (const [id, addr] of this.inMemoryAddresses.entries()) {
      if (addr.userId === userId && id !== excludeAddressId && addr.isDefault) {
        this.inMemoryAddresses.set(id, { ...addr, isDefault: false });
      }
    }
  }

  /**
   * Create an immutable snapshot string of an address to persist with Order
   * Prevents future address edits from modifying historical order records
   */
  public formatAddressSnapshot(address: CustomerAddress): string {
    const parts = [
      `Recipient: ${address.fullName} (${address.phoneNumber})`,
      `${address.houseFlatBuilding}, ${address.streetArea}`,
    ];

    if (address.landmark) {
      parts.push(`Landmark: ${address.landmark}`);
    }

    parts.push(`${address.city}, ${address.state} - ${address.postalCode} [${address.addressType}]`);

    if (address.deliveryInstructions) {
      parts.push(`Instructions: ${address.deliveryInstructions}`);
    }

    return parts.join(' | ');
  }

  private mapPrismaToAddress(prismaAddr: any): CustomerAddress {
    const fullText = `${prismaAddr.houseFlatBuilding} ${prismaAddr.streetArea} ${prismaAddr.landmark || ''}`;
    const serviceability = serviceabilityService.evaluateServiceability(
      prismaAddr.postalCode,
      prismaAddr.city,
      fullText,
      prismaAddr.latitude ? Number(prismaAddr.latitude) : undefined,
      prismaAddr.longitude ? Number(prismaAddr.longitude) : undefined
    );

    return {
      id: prismaAddr.id,
      userId: prismaAddr.userId,
      fullName: prismaAddr.fullName,
      phoneNumber: prismaAddr.phoneNumber,
      houseFlatBuilding: prismaAddr.houseFlatBuilding,
      streetArea: prismaAddr.streetArea,
      landmark: prismaAddr.landmark || undefined,
      postalCode: prismaAddr.postalCode,
      city: prismaAddr.city,
      state: prismaAddr.state,
      addressType: (prismaAddr.addressType as AddressType) || 'Home',
      isDefault: Boolean(prismaAddr.isDefault),
      deliveryInstructions: prismaAddr.deliveryInstructions || undefined,
      latitude: prismaAddr.latitude ? Number(prismaAddr.latitude) : undefined,
      longitude: prismaAddr.longitude ? Number(prismaAddr.longitude) : undefined,
      isServiceable: serviceability.isServiceable,
      serviceableZone: serviceability.zone,
      createdAt: prismaAddr.createdAt instanceof Date ? prismaAddr.createdAt.toISOString() : String(prismaAddr.createdAt),
      updatedAt: prismaAddr.updatedAt instanceof Date ? prismaAddr.updatedAt.toISOString() : String(prismaAddr.updatedAt),
    };
  }
}

export const addressService = new AddressService();
export default addressService;
