/**
 * Approved University Campus Pickup & Collection Points
 * Business Rule: SaveBite supports Counter Pickup only.
 * Food deals are reserved online and picked up directly at partner counters or designated campus collection points.
 */

export interface CampusLocationPoint {
  id: string;
  name: string;
  zone: 'North Campus Hostels' | 'South Campus Hostels' | 'Central Academic Block' | 'Campus Perimeter';
  type: 'hostel' | 'academic_block' | 'designated_point';
  description: string;
  isApproved: boolean;
}

export type CampusDeliveryPoint = CampusLocationPoint;

export const APPROVED_CAMPUS_LOCATIONS: CampusLocationPoint[] = [
  {
    id: 'campus-hostel-a',
    name: 'Hostel Block A - Pickup Desk',
    zone: 'North Campus Hostels',
    type: 'hostel',
    description: 'Hostel Block A Counter Pickup Desk',
    isApproved: true,
  },
  {
    id: 'campus-hostel-b',
    name: 'Hostel Block B - Reception Area',
    zone: 'North Campus Hostels',
    type: 'hostel',
    description: 'Hostel Block B Main Porch Reception Counter',
    isApproved: true,
  },
  {
    id: 'campus-hostel-c',
    name: 'Hostel Block C - Gate Counter',
    zone: 'South Campus Hostels',
    type: 'hostel',
    description: 'Hostel Block C Entry Lobby / Pickup Desk',
    isApproved: true,
  },
  {
    id: 'campus-hostel-d',
    name: 'Hostel Block D - Pickup Lobby',
    zone: 'South Campus Hostels',
    type: 'hostel',
    description: 'Hostel Block D Reception & Pickup Counter',
    isApproved: true,
  },
  {
    id: 'campus-academic-1',
    name: 'Central Academic Complex - Food Pickup Station',
    zone: 'Central Academic Block',
    type: 'academic_block',
    description: 'Academic Block 1 Ground Floor Pickup Station',
    isApproved: true,
  },
  {
    id: 'campus-library',
    name: 'University Library - Front Courtyard Pickup Point',
    zone: 'Central Academic Block',
    type: 'academic_block',
    description: 'Main Library Portico Pickup Point',
    isApproved: true,
  },
  {
    id: 'campus-sac',
    name: 'Student Activity Center (SAC) - Ground Floor Entry',
    zone: 'Central Academic Block',
    type: 'designated_point',
    description: 'SAC Ground Floor Cafeteria Counter',
    isApproved: true,
  },
  {
    id: 'campus-main-gate',
    name: 'Campus Main Gate - Security Desk Pickup Point',
    zone: 'Campus Perimeter',
    type: 'designated_point',
    description: 'Main Campus Entrance Visitor & Pickup Desk',
    isApproved: true,
  },
];

export const DEFAULT_CAMPUS_DELIVERY_LOCATION = APPROVED_CAMPUS_LOCATIONS[0];
export const DEFAULT_CAMPUS_PICKUP_LOCATION = APPROVED_CAMPUS_LOCATIONS[0];
