import { Response } from "express";
import TeamMember from "../team-members/model";
import Team from "../teams/model";
import Work from "../work/model";
import { AuthRequest } from "../../middlewares/auth";
import moment from "moment-timezone";

export const dashboardData = async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate, instituteId, page = 1, limit = 10 } = req.query;
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized"
      });
    }

    // Build filters based on user role
    const { teamFilter, workFilter } = buildUserFilters(user, instituteId as string);

    // Add date filters if provided
    addDateFilters(teamFilter, workFilter, startDate as string, endDate as string);

    // Get dashboard statistics
    const statistics = await getDashboardStatistics(teamFilter, workFilter);

    // Get recent works with pagination
    const recentWorksData = await getRecentWorks(workFilter, Number(page), Number(limit));

    // Get team performance statistics
    const teamPerformance = await getTeamPerformance(workFilter);

    // Send response
    res.status(200).json({
      success: true,
      data: {
        summary: statistics.summary,
        workStatus: statistics.workStatus,
        workPriority: statistics.workPriority,
        deadlineStatus: statistics.deadlineStatus,
        todayActivity: statistics.todayActivity,
        teamPerformance,
        recentWorks: recentWorksData,
      },
    });

  } catch (error: any) {
    console.error("❌ Dashboard Data Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// Helper function to build filters based on user role
const buildUserFilters = (user: any, instituteId: string) => {
  let teamFilter: any = {};
  let workFilter: any = {};

  if (user.role === "superadmin") {
    if (instituteId && instituteId !== "all") {
      teamFilter.instituteId = instituteId;
      workFilter.instituteId = instituteId;
    }
  } else if (user.role === "admin") {
    teamFilter.createdBy = user.id;
    workFilter.createdBy = user.id;
  } else {
    // Regular user - get their team member data first
    teamFilter.createdBy = user.id;
    workFilter.createdBy = user.id;
  }

  return { teamFilter, workFilter };
};

// Helper function to add date filters
const addDateFilters = (teamFilter: any, workFilter: any, startDate?: string, endDate?: string) => {
  if (startDate || endDate) {
    const createdFilter: any = {};

    if (startDate) {
      createdFilter.$gte = moment(startDate)
        .tz("Asia/Kolkata")
        .startOf("day")
        .toDate();
    }

    if (endDate) {
      createdFilter.$lte = moment(endDate)
        .tz("Asia/Kolkata")
        .endOf("day")
        .toDate();
    }

    teamFilter.createdAt = createdFilter;
    workFilter.createdAt = createdFilter;
  }
};

// Helper function to get all dashboard statistics
const getDashboardStatistics = async (teamFilter: any, workFilter: any) => {
  const todayStart = moment().tz("Asia/Kolkata").startOf("day").toDate();
  const todayEnd = moment().tz("Asia/Kolkata").endOf("day").toDate();

  // Today filters
  const todayTeamFilter = { ...teamFilter, createdAt: { $gte: todayStart, $lte: todayEnd } };
  const todayWorkFilter = { ...workFilter, createdAt: { $gte: todayStart, $lte: todayEnd } };

  // Status filters for teams
  const activeTeamsFilter = { ...teamFilter, status: "active" };
  const inactiveTeamsFilter = { ...teamFilter, status: "inactive" };

  // Status filters for works
  const workStatusFilters = {
    pending: { ...workFilter, status: "pending" },
    inProgress: { ...workFilter, status: "in_progress" },
    completed: { ...workFilter, status: "completed" },
    onHold: { ...workFilter, status: "on_hold" },
    cancelled: { ...workFilter, status: "cancelled" },
  };

  // Priority filters for works
  const workPriorityFilters = {
    low: { ...workFilter, priority: "low" },
    medium: { ...workFilter, priority: "medium" },
    high: { ...workFilter, priority: "high" },
  };

  // Deadline filters
  const deadlineFilters = {
    today: { ...workFilter, deadline: { $gte: todayStart, $lte: todayEnd } },
    upcoming: { ...workFilter, deadline: { $gt: todayEnd } },
    overdue: { ...workFilter, deadline: { $lt: todayStart } },
  };

  // Execute all counts in parallel
  const [
    totalTeams,
    activeTeams,
    inactiveTeams,
    totalWorks,
    pendingWorks,
    inProgressWorks,
    completedWorks,
    onHoldWorks,
    cancelledWorks,
    lowPriorityWorks,
    mediumPriorityWorks,
    highPriorityWorks,
    todayTeams,
    todayWorks,
    todayDeadlineWorks,
    upcomingDeadlineWorks,
    overdueDeadlineWorks,
  ] = await Promise.all([
    Team.countDocuments(teamFilter),
    Team.countDocuments(activeTeamsFilter),
    Team.countDocuments(inactiveTeamsFilter),
    Work.countDocuments(workFilter),
    Work.countDocuments(workStatusFilters.pending),
    Work.countDocuments(workStatusFilters.inProgress),
    Work.countDocuments(workStatusFilters.completed),
    Work.countDocuments(workStatusFilters.onHold),
    Work.countDocuments(workStatusFilters.cancelled),
    Work.countDocuments(workPriorityFilters.low),
    Work.countDocuments(workPriorityFilters.medium),
    Work.countDocuments(workPriorityFilters.high),
    Team.countDocuments(todayTeamFilter),
    Work.countDocuments(todayWorkFilter),
    Work.countDocuments(deadlineFilters.today),
    Work.countDocuments(deadlineFilters.upcoming),
    Work.countDocuments(deadlineFilters.overdue),
  ]);

  // Calculate completion rate
  const completionRate = totalWorks > 0
    ? ((completedWorks / totalWorks) * 100).toFixed(2)
    : "0";

  return {
    summary: {
      totalTeams,
      activeTeams,
      inactiveTeams,
      totalWorks,
      completionRate: `${completionRate}%`,
    },
    workStatus: {
      pending: pendingWorks,
      inProgress: inProgressWorks,
      completed: completedWorks,
      onHold: onHoldWorks,
      cancelled: cancelledWorks,
    },
    workPriority: {
      low: lowPriorityWorks,
      medium: mediumPriorityWorks,
      high: highPriorityWorks,
    },
    deadlineStatus: {
      today: todayDeadlineWorks,
      upcoming: upcomingDeadlineWorks,
      overdue: overdueDeadlineWorks,
    },
    todayActivity: {
      teamsCreated: todayTeams,
      worksCreated: todayWorks,
    },
  };
};

// Helper function to get recent works with pagination
const getRecentWorks = async (workFilter: any, page: number, limit: number) => {
  const skip = (page - 1) * limit;

  const [recentWorks, totalRecentWorks] = await Promise.all([
    Work.find(workFilter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("teams")
      .lean(),
    Work.countDocuments(workFilter),
  ]);

  const totalPages = Math.ceil(totalRecentWorks / limit);

  return {
    data: recentWorks,
    pagination: {
      page,
      limit,
      total: totalRecentWorks,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

// Helper function to get team performance statistics
const getTeamPerformance = async (workFilter: any) => {
  const teamPerformance = await Work.aggregate([
    { $match: workFilter },
    { $unwind: "$assignToTeamIds" },
    {
      $group: {
        _id: "$assignToTeamIds",
        totalWorks: { $sum: 1 },
        completedWorks: {
          $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
        },
        pendingWorks: {
          $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
        },
        inProgressWorks: {
          $sum: { $cond: [{ $eq: ["$status", "in_progress"] }, 1, 0] },
        },
        onHoldWorks: {
          $sum: { $cond: [{ $eq: ["$status", "on_hold"] }, 1, 0] },
        },
      },
    },
    {
      $lookup: {
        from: "teams",
        localField: "_id",
        foreignField: "teamId",
        as: "teamDetails",
      },
    },
    {
      $unwind: {
        path: "$teamDetails",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        teamId: "$_id",
        teamName: "$teamDetails.teamName",
        teamType: "$teamDetails.teamType",
        teamLeadId: "$teamDetails.teamLeadId",
        memberCount: { $size: "$teamDetails.memberIds" },
        status: "$teamDetails.status",
        totalWorks: 1,
        completedWorks: 1,
        pendingWorks: 1,
        inProgressWorks: 1,
        onHoldWorks: 1,
        completionRate: {
          $multiply: [
            { $divide: ["$completedWorks", { $max: ["$totalWorks", 1] }] },
            100,
          ],
        },
      },
    },
    { $sort: { totalWorks: -1 } },
    { $limit: 10 },
  ]);

  return teamPerformance;
};