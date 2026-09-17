/**
 * searchController — CarePath AI
 *
 * Public / USER search endpoints for finding hospitals and professionals.
 *
 * GET /api/search/hospitals     — search verified hospitals
 * GET /api/search/hospitals/:id — get single hospital details
 * GET /api/search/professionals — search verified professionals
 * GET /api/search/professionals/:id — get single professional
 */

'use strict';

const { Hospital, Professional, Expert } = require('../models');
const { success, fail } = require('../utils/responseHelper');
const { AppError } = require('../middleware/errorHandler');

// ── Search hospitals ──────────────────────────────────────────────────────────
const searchHospitals = async (req, res, next) => {
  try {
    const {
      q, city, country, specialty, emergency,
      page = 1, limit = 20,
    } = req.query;

    const filter = { verificationStatus: 'VERIFIED', isActive: true };

    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { specialties: { $regex: q, $options: 'i' } },
      ];
    }
    if (city)      filter.city    = { $regex: city,    $options: 'i' };
    if (country)   filter.country = { $regex: country, $options: 'i' };
    if (specialty) filter.specialties = { $regex: specialty, $options: 'i' };
    if (emergency === 'true') filter.emergencyAvailable = true;

    const hospitals = await Hospital.find(filter)
      .select('name description city state country phone email specialties services facilities emergencyAvailable verificationStatus location')
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Hospital.countDocuments(filter);
    return success(res, { hospitals, total, page: Number(page) }, 'Hospitals retrieved');
  } catch (err) {
    next(err);
  }
};

// ── Get single hospital ───────────────────────────────────────────────────────
const getHospital = async (req, res, next) => {
  try {
    const hospital = await Hospital.findOne({
      _id: req.params.id,
      verificationStatus: 'VERIFIED',
      isActive: true,
    }).select('-createdBy -verifiedBy');

    if (!hospital) return next(new AppError('Hospital not found', 404));
    return success(res, { hospital }, 'Hospital retrieved');
  } catch (err) {
    next(err);
  }
};

// ── Search professionals ──────────────────────────────────────────────────────
const searchProfessionals = async (req, res, next) => {
  try {
    const {
      q, specialization, hospitalId,
      page = 1, limit = 20,
    } = req.query;

    const filter = { verificationStatus: 'VERIFIED', isActive: true };

    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { specialization: { $regex: q, $options: 'i' } },
        { bio: { $regex: q, $options: 'i' } },
      ];
    }
    if (specialization) filter.specialization = { $regex: specialization, $options: 'i' };
    if (hospitalId) {
      filter['hospitalAssociations'] = {
        $elemMatch: { hospitalId, status: 'APPROVED' },
      };
    }

    const professionals = await Professional.find(filter)
      .select('name specialization qualification experience bio consultationModes availability profileImage')
      .populate('hospitalAssociations.hospitalId', 'name city country')
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Professional.countDocuments(filter);
    return success(res, { professionals, total, page: Number(page) }, 'Professionals retrieved');
  } catch (err) {
    next(err);
  }
};

// ── Get single professional ───────────────────────────────────────────────────
const getProfessional = async (req, res, next) => {
  try {
    const professional = await Professional.findOne({
      _id: req.params.id,
      verificationStatus: 'VERIFIED',
      isActive: true,
    })
      .select('-userId')
      .populate('hospitalAssociations.hospitalId', 'name city country emergencyAvailable');

    if (!professional) return next(new AppError('Professional not found', 404));
    return success(res, { professional }, 'Professional retrieved');
  } catch (err) {
    next(err);
  }
};

// ── Search individual experts ─────────────────────────────────────────────────
const searchExperts = async (req, res, next) => {
  try {
    const { q, specialization, page = 1, limit = 20 } = req.query;

    const filter = { verificationStatus: 'VERIFIED', isActive: true };

    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { specialization: { $regex: q, $options: 'i' } },
        { bio: { $regex: q, $options: 'i' } },
      ];
    }
    if (specialization) filter.specialization = { $regex: specialization, $options: 'i' };

    const experts = await Expert.find(filter)
      .select('name specialization qualification experience bio consultationModes profileImage')
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Expert.countDocuments(filter);
    return success(res, { experts, total, page: Number(page) }, 'Experts retrieved');
  } catch (err) {
    next(err);
  }
};

// ── Get single expert ─────────────────────────────────────────────────────────
const getExpert = async (req, res, next) => {
  try {
    const expert = await Expert.findOne({
      _id: req.params.id,
      verificationStatus: 'VERIFIED',
      isActive: true,
    }).select('-userId');

    if (!expert) return next(new AppError('Expert not found', 404));
    return success(res, { expert }, 'Expert retrieved');
  } catch (err) {
    next(err);
  }
};

// ── Get professional available slots ─────────────────────────────────────────
const getProfessionalAvailability = async (req, res, next) => {
  try {
    const { getProfessionalSlots } = require('../services/availabilityService');
    const { date } = req.query;
    if (!date) {
      return fail(res, 'date query parameter is required (YYYY-MM-DD)', 400);
    }
    const result = await getProfessionalSlots(req.params.id, date);
    return success(res, result, 'Availability retrieved');
  } catch (err) {
    next(err);
  }
};

// ── Get expert available slots ────────────────────────────────────────────────
const getExpertAvailability = async (req, res, next) => {
  try {
    const { getExpertSlots } = require('../services/availabilityService');
    const { date } = req.query;
    if (!date) {
      return fail(res, 'date query parameter is required (YYYY-MM-DD)', 400);
    }
    const result = await getExpertSlots(req.params.id, date);
    return success(res, result, 'Availability retrieved');
  } catch (err) {
    next(err);
  }
};

// ── Nearby hospitals (distance-sorted from user coordinates) ─────────────────
const getNearbyHospitals = async (req, res, next) => {
  try {
    const { lat, lng, radius = 50, emergency } = req.query;

    if (!lat || !lng) {
      return fail(res, 'lat and lng query parameters are required', 400);
    }

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const radiusKm = parseFloat(radius) || 50;

    if (isNaN(userLat) || isNaN(userLng)) {
      return fail(res, 'lat and lng must be valid numbers', 400);
    }

    const filter = { verificationStatus: 'VERIFIED', isActive: true };
    if (emergency === 'true') filter.emergencyAvailable = true;

    // Fetch hospitals that have coordinates stored
    const hospitals = await Hospital.find({
      ...filter,
      'location.latitude':  { $ne: null, $exists: true },
      'location.longitude': { $ne: null, $exists: true },
    }).select('name description city state country phone email specialties services emergencyAvailable verificationStatus location address');

    // Haversine distance calculation
    const toRad = (deg) => (deg * Math.PI) / 180;
    const haversineKm = (lat1, lng1, lat2, lng2) => {
      const R = 6371;
      const dLat = toRad(lat2 - lat1);
      const dLng = toRad(lng2 - lng1);
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    const nearby = hospitals
      .map((h) => {
        const dist = haversineKm(
          userLat, userLng,
          h.location.latitude, h.location.longitude
        );
        return { ...h.toObject(), distanceKm: Math.round(dist * 10) / 10 };
      })
      .filter((h) => h.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 20);

    return success(res, { hospitals: nearby, total: nearby.length, userLocation: { lat: userLat, lng: userLng } }, 'Nearby hospitals retrieved');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  searchHospitals, getHospital,
  searchProfessionals, getProfessional,
  searchExperts, getExpert,
  getProfessionalAvailability, getExpertAvailability,
  getNearbyHospitals,
};
