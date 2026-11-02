/**
 * Approved University Campus Delivery Locations
 * Business Rule: Restaurants are located outside the university campus,
 * but deliver orders exclusively to approved locations inside the campus and hostels.
 */

export interface CampusDeliveryPoint {
  id: string;
  name: string;
  zone: 'North Campus Hostels' | 'South Campus Hostels' | 'Central Academic Block' | 'Campus Perimeter';
  type: 'hostel' | 'academic_block' | 'designated_point';
  description: string;
  isApproved: boolean;
}

export const APPROVED_CAMPUS_LOCATIONS: CampusDeliveryPoint[] = [
  {
    id: 'campus-hostel-a',
    name: 'Hostel Block A - Main Entrance Drop Point',
    zone: 'North Campus Hostels',
    type: 'hostel',
    description: 'Hostel Block A Security Gate Drop Table',
    isApproved: true,
  },
  {
    id: 'campus-hostel-b',
    name: 'Hostel Block B - Reception Area',
    zone: 'North Campus Hostels',
    type: 'hostel',
    description: 'Hostel Block B Main Porch Reception Desk',
    isApproved: true,
  },
  {
    id: 'campus-hostel-c',
    name: 'Hostel Block C - Gate Desk',
    zone: 'South Campus Hostels',
    type: 'hostel',
    description: 'Hostel Block C Entry Lobby / Delivery Desk',
    isApproved: true,
  },
  {
    id: 'campus-hostel-d',
    name: 'Hostel Block D - Delivery Lobby',
    zone: 'South Campus Hostels',
    type: 'hostel',
    description: 'Hostel Block D Reception & Delivery Box',
    isApproved: true,
  },
  {
    id: 'campus-academic-1',
    name: 'Central Academic Complex - Food Drop Station',
    zone: 'Central Academic Block',
    type: 'academic_block',
    description: 'Academic Block 1 Ground Floor Drop Station',
    isApproved: true,
  },
  {
    id: 'campus-library',
    name: 'University Library - Front Courtyard Drop Point',
    zone: 'Central Academic Block',
    type: 'academic_block',
    description: 'Main Library Portico Drop Point',
    isApproved: true,
  },
  {
    id: 'campus-sac',
    name: 'Student Activity Center (SAC) - Ground Floor Entry',
    zone: 'Central Academic Block',
    type: 'designated_point',
    description: 'SAC Ground Floor Cafeteria Entrance',
    isApproved: true,
  },
  {
    id: 'campus-main-gate',
    name: 'Campus Main Gate - Security Desk Drop Point',
    zone: 'Campus Perimeter',
    type: 'designated_point',
    description: 'Main Campus Entrance Visitor & Delivery Desk',
    isApproved: true,
  },
];

/**
 * Validates whether a delivery address targets an approved university campus location
 */
export const isApprovedCampusDeliveryAddress = (address?: string): boolean => {
  if (!address || address.trim() === '') {
    return false;
  }

  const normalized = address.toLowerCase();

  // Reject explicit off-campus locations
  if (
    normalized.includes('off-campus') ||
    normalized.includes('outside campus') ||
    normalized.includes('highway') ||
    normalized.includes('downtown') ||
    normalized.includes('suburb')
  ) {
    return false;
  }

  // Check against approved campus identifiers or general campus designation
  const matchesApprovedPoint = APPROVED_CAMPUS_LOCATIONS.some((loc) =>
    normalized.includes(loc.name.toLowerCase()) ||
    normalized.includes(loc.id.toLowerCase()) ||
    normalized.includes(loc.description.toLowerCase())
  );

  if (matchesApprovedPoint) {
    return true;
  }

  // Allow general campus / hostel / block drop patterns (e.g. "Hostel Block A, Room 302")
  const hasCampusKeywords =
    (normalized.includes('campus') ||
     normalized.includes('hostel') ||
     normalized.includes('academic') ||
     normalized.includes('library') ||
     normalized.includes('sac') ||
     normalized.includes('hall')) &&
    !normalized.includes('off-campus');

  return hasCampusKeywords;
};

export const DEFAULT_CAMPUS_DELIVERY_LOCATION = APPROVED_CAMPUS_LOCATIONS[0];
