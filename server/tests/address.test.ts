import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/app';

const app = createApp();

describe('Customer Delivery Address Management & Serviceability API', () => {
  const customerToken = 'user-sarah';
  const otherCustomerToken = 'test-other-customer';

  let createdAddressId: string;
  let secondAddressId: string;

  // 1. Serviceability Check - Campus Zone
  it('1. should verify campus PIN code as serviceable with ₹0 delivery fee', async () => {
    const res = await request(app)
      .post('/api/v1/addresses/check-serviceability')
      .send({ postalCode: '560092', city: 'Bengaluru' });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.isServiceable, true);
    assert.equal(res.body.data.zone, 'campus');
    assert.equal(res.body.data.deliveryFeeInr, 0);
    assert.match(res.body.data.message, /hostel drop table/i);
  });

  // 2. Serviceability Check - Metro Outside-Campus Zone
  it('2. should verify metro PIN code as serviceable with standard courier fee', async () => {
    const res = await request(app)
      .post('/api/v1/addresses/check-serviceability')
      .send({ postalCode: '560038', city: 'Bengaluru' });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.isServiceable, true);
    assert.equal(res.body.data.zone, 'metro_city');
    assert.equal(res.body.data.deliveryFeeInr, 40);
  });

  // 3. Serviceability Check - Out of Zone PIN
  it('3. should reject out-of-zone PIN code with clear service boundary message', async () => {
    const res = await request(app)
      .post('/api/v1/addresses/check-serviceability')
      .send({ postalCode: '700001', city: 'Kolkata' });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.isServiceable, false);
    assert.equal(res.body.data.zone, 'out_of_zone');
    assert.match(res.body.data.message, /outside our 10 km service radius/i);
  });

  // 4. Serviceability Check - Invalid PIN format
  it('4. should reject invalid PIN code format (< 6 digits) with 400 Bad Request', async () => {
    const res = await request(app)
      .post('/api/v1/addresses/check-serviceability')
      .send({ postalCode: '5600' });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /valid 6-digit Indian PIN code/i);
  });

  // 5. Authorization: Reject unauthenticated address access
  it('5. should reject address listing without Authorization header with 401', async () => {
    const res = await request(app).get('/api/v1/addresses');
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /Unauthorized/i);
  });

  // 6. Get addresses for authenticated customer
  it('6. should retrieve saved delivery addresses for authenticated customer', async () => {
    const res = await request(app)
      .get('/api/v1/addresses')
      .set('Authorization', `Bearer ${customerToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data.addresses));
    assert.ok(res.body.data.addresses.length > 0);
    // First address should be default
    assert.equal(res.body.data.addresses[0].isDefault, true);
  });

  // 7. Create a new valid delivery address
  it('7. should create a new campus hostel delivery address', async () => {
    const res = await request(app)
      .post('/api/v1/addresses')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        fullName: 'Sarah Mehta',
        phoneNumber: '9876543210',
        houseFlatBuilding: 'Hostel Block C, Room 305',
        streetArea: 'East Campus Avenue',
        landmark: 'Opposite Student Activity Centre',
        postalCode: '560092',
        city: 'Bengaluru',
        state: 'Karnataka',
        addressType: 'Hostel',
        isDefault: false,
        deliveryInstructions: 'Leave with hostel security guard',
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.address);
    assert.equal(res.body.data.address.postalCode, '560092');
    assert.equal(res.body.data.address.addressType, 'Hostel');
    assert.equal(res.body.data.address.isServiceable, true);
    assert.equal(res.body.data.address.serviceableZone, 'campus');
    createdAddressId = res.body.data.address.id;
  });

  // 8. Reject invalid phone number
  it('8. should reject address creation with invalid phone number (< 10 digits)', async () => {
    const res = await request(app)
      .post('/api/v1/addresses')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        fullName: 'Sarah Mehta',
        phoneNumber: '12345',
        houseFlatBuilding: 'Flat 101',
        streetArea: 'MG Road',
        postalCode: '560001',
        city: 'Bengaluru',
        state: 'Karnataka',
      });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /valid 10-digit Indian mobile number/i);
  });

  // 9. Reject invalid PIN code format
  it('9. should reject address creation with non-numeric or short PIN code', async () => {
    const res = await request(app)
      .post('/api/v1/addresses')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        fullName: 'Sarah Mehta',
        phoneNumber: '9876543210',
        houseFlatBuilding: 'Flat 101',
        streetArea: 'MG Road',
        postalCode: 'ABCDEF',
        city: 'Bengaluru',
        state: 'Karnataka',
      });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /PIN code must be a valid 6-digit number/i);
  });

  // 10. Update an existing address
  it('10. should update delivery instructions and landmark of an address', async () => {
    const res = await request(app)
      .patch(`/api/v1/addresses/${createdAddressId}`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        landmark: 'Near North Gate ATM',
        deliveryInstructions: 'Ring bell twice and call mobile number',
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.address.landmark, 'Near North Gate ATM');
    assert.equal(res.body.data.address.deliveryInstructions, 'Ring bell twice and call mobile number');
  });

  // 11. Set address as default
  it('11. should set an address as the default delivery address and unset others', async () => {
    const res = await request(app)
      .patch(`/api/v1/addresses/${createdAddressId}/default`)
      .set('Authorization', `Bearer ${customerToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.address.isDefault, true);

    // Verify in address list that createdAddressId is now default
    const listRes = await request(app)
      .get('/api/v1/addresses')
      .set('Authorization', `Bearer ${customerToken}`);

    assert.equal(listRes.status, 200);
    assert.equal(listRes.body.data.addresses[0].id, createdAddressId);
    assert.equal(listRes.body.data.addresses[0].isDefault, true);
  });

  // 12. Cross-user access control: Other customer cannot view or modify address
  it('12. should deny access when another customer attempts to view foreign address', async () => {
    const res = await request(app)
      .get(`/api/v1/addresses/${createdAddressId}`)
      .set('Authorization', `Bearer ${otherCustomerToken}`);

    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /Access denied/i);
  });

  // 13. Create a second address for delete test
  it('13. should create a second address', async () => {
    const res = await request(app)
      .post('/api/v1/addresses')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        fullName: 'Sarah Mehta (Work)',
        phoneNumber: '9876543210',
        houseFlatBuilding: 'Tech Park Tower B, 4th Floor',
        streetArea: 'Outer Ring Road, Bellandur',
        postalCode: '560103',
        city: 'Bengaluru',
        state: 'Karnataka',
        addressType: 'Work',
        isDefault: false,
      });

    assert.equal(res.status, 201);
    secondAddressId = res.body.data.address.id;
  });

  // 14. Delete address
  it('14. should delete an address successfully', async () => {
    const res = await request(app)
      .delete(`/api/v1/addresses/${secondAddressId}`)
      .set('Authorization', `Bearer ${customerToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.match(res.body.message, /removed successfully/i);

    // Verify 404 upon subsequent lookup
    const lookupRes = await request(app)
      .get(`/api/v1/addresses/${secondAddressId}`)
      .set('Authorization', `Bearer ${customerToken}`);

    assert.equal(lookupRes.status, 404);
  });
});
