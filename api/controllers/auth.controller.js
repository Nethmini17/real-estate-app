import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";

export const register = async (req, res) => {
  const { username, email, password } = req.body;
  console.log(req.body);

  try {
    //Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log(hashedPassword);
    //Create new user n save to db
    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
      },
    });
    console.log(newUser);

    res.status(201).json({ message: "User created successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to create user" });
  }
};

export const login = async (req, res) => {
  const { username, password } = req.body;

  try {
    //CHECK IF USER EXISTS

    const user = await prisma.user.findUnique({
      where: {
        username,
      },
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    //CHECK IF PASSWORD IS CORRECT
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    //GENERATE COOKIE TOKEN AND SEND TO THE USER
    //res.setHeader("Set-Cookie", "test=" + "myValue").json({message: "Logged in successfully"});
    const age = 1000 * 60 * 60 * 24 * 7;
    const token = jwt.sign(
      {
        id: user.id,
        isAdmin:false,
      },
      process.env.JWT_SECRET_KEY,
      {
        expiresIn: age,
      }
    );
console.log("Generated token:", token)

    const {password:userPassword, ...userData} = user;
    res
      .cookie("token", token, {
        httpOnly: true,
        // secure: true,
       // sameSite: "none",
        maxAge: age,
      })
    res.status(200)
      .json( userData );
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to login" });
  }
};

export const logout = (req, res) => {
  res.clearCookie("token").status(201).json({ message: "Logged out" });
};
