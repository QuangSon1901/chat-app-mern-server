const formidable = require('formidable');
const validator = require('validator');
const registerModel = require('../models/authModel.js');
const fs = require('fs');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

module.exports.userRegister = (req, res) => {
    const form = formidable();
    form.parse(req, async (err, fields, files) => {
        const { userName, password, confirmPassword, email } = fields;
        const { image } = files;

        const error = [];

        if (!userName) {
            error.push('please provide user name');
        }

        if (!email) {
            error.push('please provide email');
        }

        if (email && !validator.isEmail(email)) {
            error.push('please provide your valid email');
        }

        if (!password) {
            error.push('please provide password');
        }

        if (!confirmPassword) {
            error.push('please provide confirm password');
        }

        if (password && confirmPassword && password !== confirmPassword) {
            error.push('your password and confirm password not same');
        }

        if (password && password.length < 6) {
            error.push('please provide password must be 6 character');
        }

        if (Object.keys(files).length === 0) {
            error.push('please provide user image');
        }

        if (error.length > 0) {
            res.status(400).json({
                error: { errorMessage: error },
            });
        } else {
            const getImageName = image.originalFilename;
            const randNumber = Math.floor(Math.random() * 99999);

            const newImageName = randNumber + getImageName;

            image.originalFilename = newImageName;

            const newPath = __dirname + `../../uploads/${image.originalFilename}`;

            try {
                const checkUser = await registerModel.findOne({ email });
                if (checkUser) {
                    res.status(404).json({
                        error: { errorMessage: ['Your email allready axited.'] },
                    });
                } else {
                    fs.copyFile(image.filepath, newPath, async (error) => {
                        if (!error) {
                            const userCreate = await registerModel.create({
                                userName,
                                email,
                                password: await bcrypt.hash(password, 10),
                                image: image.originalFilename,
                            });

                            const token = jwt.sign(
                                {
                                    id: userCreate._id,
                                    email: userCreate.email,
                                    userName: userCreate.userName,
                                    image: userCreate.image,
                                    registerTime: userCreate.createdAt,
                                },
                                process.env.SECRET,
                                { expiresIn: process.env.TOKEN_EXP },
                            );

                            const options = {
                                expires: new Date(Date.now() + process.env.COOKIE_EXP * 24 * 60 * 60 * 1000),
                                httpOnly: true,
                                sameSite: 'strict',
                            };

                            res.status(201).cookie('authToken', token, options).json({
                                successMessage: 'Your register successfull',
                                token,
                            });

                            console.log('register success!');
                        } else {
                            res.status(500).json({
                                error: {
                                    errorMessage: ['Internal server error'],
                                },
                            });
                        }
                    });
                }
            } catch (error) {
                res.status(500).json({
                    error: {
                        errorMessage: ['Internal server error'],
                    },
                });
            }
        }
    });
};
