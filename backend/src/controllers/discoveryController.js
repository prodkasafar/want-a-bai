import prisma from '../config/db.js';

export async function discoverMaids(req, res, next) {
  try {
    const { serviceId, maxSalary, status, search, page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build query conditions
    const whereConditions = {};

    // 1. Availability Status Filter
    if (status) {
      whereConditions.status = status;
    }

    // 2. Name search
    if (search) {
      whereConditions.fullName = {
        contains: search
      };
    }

    // 3. Service and Salary Filtering
    if (serviceId || maxSalary) {
      const serviceConditions = {};
      if (serviceId) {
        serviceConditions.serviceId = serviceId;
      }
      if (maxSalary) {
        serviceConditions.expectedSalary = {
          lte: parseFloat(maxSalary)
        };
      }

      whereConditions.services = {
        some: serviceConditions
      };
    }

    // Get total count
    const totalCount = await prisma.maidProfile.count({
      where: whereConditions
    });

    // Get profiles
    const maids = await prisma.maidProfile.findMany({
      where: whereConditions,
      include: {
        services: {
          include: {
            service: true
          }
        }
      },
      skip,
      take: limitNum,
      orderBy: {
        fullName: 'asc'
      }
    });

    return res.status(200).json({
      maids,
      pagination: {
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / limitNum),
        currentPage: pageNum,
        limit: limitNum
      }
    });
  } catch (error) {
    next(error);
  }
}
