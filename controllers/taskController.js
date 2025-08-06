import { jsonStatus, status } from "../helper/api.responses.js";
import { catchError } from "../helper/service.js";
import Task from "../schemas/Task.js";
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from "date-fns";

// Create a task
export const createTask = async (req, res) => {
  try {
    const { title, description } = req.body;

    const task = await Task.create({
      user: req.user._id,
      title,
      description,
    });

    return res.status(status.Create).json({
      status: jsonStatus.Create,
      success: true,
      data: task,
    });
  } catch (error) {
    catchError("createTask", error, req, res);
  }
};

// Get all tasks for a user with pagination and filtering
export const getTasks = async (req, res) => {
  try {
    const { page = 1, limit = 10, taskStatus, title } = req.query;

    const query = { user: req.user._id };

    if (taskStatus) query.status = status;
    if (title) query.title = { $regex: title, $options: "i" }; // case-insensitive partial match

    const tasks = await Task.find(query)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const total = await Task.countDocuments(query);

    return res.status(status.OK).json({
      status: jsonStatus.OK,
      success: true,
      data: tasks,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    catchError("getTasks", error, req, res);
  }
};

// Update a task
export const updateTask = async (req, res) => {
  try {
    const { title, description, _id } = req.body;

    const task = await Task.findOneAndUpdate(
      { _id: _id, user: req.user._id },
      { title, description },
      { new: true }
    );

    if (!task) {
      return res.status(status.NotFound).json({
        status: jsonStatus.NotFound,
        success: false,
        message: "Task not found",
      });
    }

    return res.status(status.OK).json({
      status: jsonStatus.OK,
      success: true,
      data: task,
    });
  } catch (error) {
    catchError("updateTask", error, req, res);
  }
};

// Delete a task
export const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findOneAndDelete({ _id: id, user: req.user._id });

    if (!task) {
      return res.status(status.NotFound).json({
        status: jsonStatus.NotFound,
        success: false,
        message: "Task not found",
      });
    }

    return res.status(status.OK).json({
      status: jsonStatus.OK,
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    catchError("deleteTask", error, req, res);
  }
};

// Start tracking
export const startTaskTimer = async (req, res) => {
  try {
    const userId = req.user._id;

    // Check if user already has a running task
    const alreadyRunning = await Task.findOne({ user: userId, isRunning: true });
    if (alreadyRunning)
      return res.status(status.BadRequest).json({
        status: jsonStatus.BadRequest,
        success: false,
        message: "Another task is already running. Please stop it first.",
      });

    // Find the task to start
    const task = await Task.findOne({ _id: req.params.id, user: userId });

    if (!task)
      return res.status(status.BadRequest).json({
        status: jsonStatus.BadRequest,
        success: false,
        message: "Task not found",
      });

    if (task.isRunning)
      return res.status(status.BadRequest).json({
        status: jsonStatus.BadRequest,
        success: false,
        message: "This task is already running",
      });

    // Start task
    task.isRunning = true;
    task.startTime = new Date();
    task.status = "In Progress";
    await task.save();

    return res.status(status.OK).json({
      status: jsonStatus.OK,
      success: true,
      message: "Timer started",
    });
  } catch (error) {
    catchError("startTask", error, req, res);
  }
};


// Stop tracking
export const stopTaskTimer = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });

    if (!task || !task.isRunning || !task.startTime)
      return res.status(400).json({ message: "Task is not running" });

    const now = new Date();
    const sessionDuration = Math.floor((now - task.startTime) / 1000); // in seconds

    task.duration += sessionDuration;
    task.isRunning = false;
    
    if (req.body.isComplete) {
      task.endTime = now;
      task.status = "Completed";
    }

    await task.save();

    return res.status(status.OK).json({
      status: jsonStatus.OK,
      success: true,
      message: "Timer stopped",
      sessionDuration,
      totalDuration: task.duration,
      lastEndedAt: task.endTime,
    });
  } catch (error) {
    catchError("stopTask", error, req, res);
  }
};

export const getDashboard = async (req, res) => {
  try {
    const userId = req.user._id;
    const today = new Date();

    const [todayTasks, todaySummaryAgg, weeklySummaryAgg, monthlySummaryAgg] =
      await Promise.all([
        // Fetch today's tasks
        Task.find({
          user: userId,
          createdAt: { $gte: startOfDay(today), $lte: endOfDay(today) },
        }).sort({ createdAt: -1 }),

        // Daily summary aggregation
        Task.aggregate([
          {
            $match: {
              user: userId,
              createdAt: { $gte: startOfDay(today), $lte: endOfDay(today) },
            },
          },
          {
            $group: {
              _id: null,
              totalTasks: { $sum: 1 },
              completedTasks: {
                $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] },
              },
              inProgressTasks: {
                $sum: { $cond: [{ $eq: ["$status", "In Progress"] }, 1, 0] },
              },
              pendingTasks: {
                $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] },
              },
              totalTimeSpent: { $sum: "$duration" },
            },
          },
        ]),

        // Weekly summary aggregation
        Task.aggregate([
          {
            $match: {
              user: userId,
              createdAt: { $gte: startOfWeek(today), $lte: endOfWeek(today) },
            },
          },
          {
            $group: {
              _id: null,
              totalTasks: { $sum: 1 },
              completedTasks: {
                $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] },
              },
              totalTimeSpent: { $sum: "$duration" },
            },
          },
        ]),

        // Monthly summary aggregation
        Task.aggregate([
          {
            $match: {
              user: userId,
              createdAt: { $gte: startOfMonth(today), $lte: endOfMonth(today) },
            },
          },
          {
            $group: {
              _id: null,
              totalTasks: { $sum: 1 },
              completedTasks: {
                $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] },
              },
              totalTimeSpent: { $sum: "$duration" },
            },
          },
        ]),
      ]);

    // Format summaries
    const todaySummary = todaySummaryAgg[0] || {
      totalTasks: 0,
      completedTasks: 0,
      inProgressTasks: 0,
      pendingTasks: 0,
      totalTimeSpent: 0,
    };

    const weeklySummary = weeklySummaryAgg[0] || {
      totalTasks: 0,
      completedTasks: 0,
      totalTimeSpent: 0,
    };

    const monthlySummary = monthlySummaryAgg[0] || {
      totalTasks: 0,
      completedTasks: 0,
      totalTimeSpent: 0,
    };

    return res.status(status.OK).json({
      status: jsonStatus.OK,
      success: true,
      data: {
  todayTasks,
  summaries: {
    today: todaySummary,
    weekly: weeklySummary,
    monthly: monthlySummary,
  }
}

    });
  } catch (error) {
    catchError("dashboard", error, req, res);
  }
};
