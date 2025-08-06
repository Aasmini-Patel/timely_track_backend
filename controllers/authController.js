import { jsonStatus, status } from "../helper/api.responses.js";
import { catchError } from "../helper/service.js";
import { generateToken } from "../helper/generateToken.js";
import User from "../schemas/User.js";
import dotenv from "dotenv";
dotenv.config();

// register
export const registerUser = async (req, res) => {
  try {
    const { email } = req.body;

    // check if exist
    const isExist = await User.findOne({ email });
    
    if (isExist) {
      return res
        .status(status.BadRequest)
        .json({
          status: jsonStatus.BadRequest,
          success: false,
          message: "User already exists with the same email ID.",
        });
    }

    // insert user in db
    let newUser = new User(req.body);
    newUser = await newUser.save();

    // Generate token
    const token = generateToken(newUser._id, process.env.EXPIRES_IN);

    delete newUser.password;

    res.status(status.Create).json({
      status: jsonStatus.Create,
      success: true,
      data: newUser,
      token,
    });
  } catch (error) {
    return catchError("register user", error, req, res);
  }
};

// login
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(status.NotFound).json({
        status: jsonStatus.NotFound,
        success: false,
        message: "User not found",
      });
    }

    const isMatch = await user.comparePassword(password);

    // compare password
    if (!isMatch) {
      return res.status(status.BadRequest).json({
        status: jsonStatus.BadRequest,
        success: false,
        message: "Invalid password",
      });
    }

    // Generate token
    const token = generateToken(user._id, process.env.EXPIRES_IN);

    const userObject = user.toObject();
    delete userObject.password;

    res.status(status.OK).json({
      status: jsonStatus.OK,
      success: true,
      data: userObject,
      token,
    });
  } catch (error) {
    return catchError("login user", error, req, res);
  }
};
