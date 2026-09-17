/**
 * availabilityService — CarePath AI
 *
 * Generates available time slots for a professional/expert on a given date,
 * taking into account their weekly schedule and existing active appointments.
 *
 * Used by:
 *   GET /api/search/availability/professional/:id?date=YYYY-MM-DD
 *   GET /api/search/availability/expert/:id?date=YYYY-MM-DD
 */

'use strict';

const { Appointment, Professional, Expert } = require('../models');
const { APPOINTMENT_STATUS } = require('../utils/constants');

const SLOT_DURATION_MINUTES = 30; // default slot length

// Day names matching the model enum
const DAY_NAMES = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

/**
 * Parse "HH:MM" string → total minutes since midnight
 */
const toMinutes = (timeStr) => {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

/**
 * Convert minutes since midnight → "HH:MM" string
 */
const fromMinutes = (mins) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

/**
 * Generate all slots for a given day window.
 * Returns array of "HH:MM" strings.
 */
const generateSlots = (startTime, endTime, slotDuration = SLOT_DURATION_MINUTES) => {
  const start = toMinutes(startTime);
  const end = toMinutes(endTime);
  if (start === null || end === null || start >= end) return [];

  const slots = [];
  for (let t = start; t + slotDuration <= end; t += slotDuration) {
    slots.push(fromMinutes(t));
  }
  return slots;
};

/**
 * Fetch active appointments for a provider on a specific date.
 * Returns a Set of booked time strings "HH:MM".
 */
const getBookedSlots = async ({ professionalId, expertId, date }) => {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const activeStatuses = [APPOINTMENT_STATUS.PENDING, APPOINTMENT_STATUS.CONFIRMED];

  const filter = {
    date: { $gte: dayStart, $lte: dayEnd },
    status: { $in: activeStatuses },
  };
  if (professionalId) filter.professionalId = professionalId;
  if (expertId) filter.expertId = expertId;

  const appointments = await Appointment.find(filter).select('time');
  return new Set(appointments.map((a) => a.time));
};

/**
 * Get available slots for a professional on a given date string (YYYY-MM-DD).
 * Returns:
 *   { available: true, slots: [{time, available}], dayName }
 *   OR
 *   { available: false, message: '...' }
 */
const getProfessionalSlots = async (professionalId, dateStr) => {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return { available: false, message: 'Invalid date' };

  const dayName = DAY_NAMES[date.getDay()];

  const professional = await Professional.findById(professionalId).select('availability name');
  if (!professional) return { available: false, message: 'Professional not found' };

  const daySchedule = professional.availability?.find(
    (a) => a.day === dayName && a.available
  );
  if (!daySchedule) {
    return {
      available: false,
      message: `Not available on ${dayName.charAt(0) + dayName.slice(1).toLowerCase()}s`,
    };
  }

  const allSlots = generateSlots(daySchedule.startTime, daySchedule.endTime);
  if (allSlots.length === 0) {
    return { available: false, message: 'No slots configured for this day' };
  }

  const booked = await getBookedSlots({ professionalId, date });

  const slots = allSlots.map((time) => ({
    time,
    available: !booked.has(time),
  }));

  return {
    available: slots.some((s) => s.available),
    dayName,
    providerName: professional.name,
    slots,
  };
};

/**
 * Get available slots for an expert on a given date string (YYYY-MM-DD).
 */
const getExpertSlots = async (expertId, dateStr) => {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return { available: false, message: 'Invalid date' };

  const dayName = DAY_NAMES[date.getDay()];

  const expert = await Expert.findById(expertId).select('availability name');
  if (!expert) return { available: false, message: 'Expert not found' };

  const daySchedule = expert.availability?.find(
    (a) => a.day === dayName && a.available
  );
  if (!daySchedule) {
    return {
      available: false,
      message: `Not available on ${dayName.charAt(0) + dayName.slice(1).toLowerCase()}s`,
    };
  }

  const allSlots = generateSlots(daySchedule.startTime, daySchedule.endTime);
  if (allSlots.length === 0) {
    return { available: false, message: 'No slots configured for this day' };
  }

  const booked = await getBookedSlots({ expertId, date });

  const slots = allSlots.map((time) => ({
    time,
    available: !booked.has(time),
  }));

  return {
    available: slots.some((s) => s.available),
    dayName,
    providerName: expert.name,
    slots,
  };
};

module.exports = { getProfessionalSlots, getExpertSlots, getBookedSlots };
