const formidable = require('formidable');
const validator = require('validator');
const registerModel = require('../models/authModel.js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const cloudinary = require('cloudinary').v2;

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

        if (Object.keys(files).length !== 0) {
            error.push('please provide user image');
        }

        if (Object.keys(files).length === 0) {
            const { originalFilename, size, mimetype } = files.image;
            const imageSize = size / 1000 / 1000;
            const imageType = mimetype.split('/')[1];
            if (imageType !== 'png' && imageType !== 'jpg' && imageType !== 'jpeg') {
                error.push('please provide user image');
            }
            if (imageSize > 8) {
                error.push('please provide your image less then 8 MB');
            }
        }

        if (error.length > 0) {
            res.status(400).json({
                error: { errorMessage: error },
            });
        } else {
            cloudinary.config({
                cloud_name: process.env.CLOUD_NAME,
                api_key: process.env.API_KEY,
                api_secret: process.env.SECRET_CLD,
                secure: true,
            });

            try {
                const checkUser = await registerModel.findOne({ email });
                if (checkUser) {
                    res.status(404).json({
                        error: { errorMessage: ['Your email allready axited.'] },
                    });
                } else {
                    try {
                        const result = await cloudinary.uploader.upload(files.image.filepath);
                        const userCreate = await registerModel.create({
                            userName,
                            email,
                            password: await bcrypt.hash(password, 10),
                            image: result.url,
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
                    } catch (error) {
                        res.status(404).json({
                            error: {
                                errorMessage: ['Image upload fail'],
                            },
                        });
                    }
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

module.exports.userLogin = async (req, res) => {
    const error = [];

    const { email, password } = req.body;

    if (!email) {
        error.push('Please provide your email!');
    }

    if (!password) {
        error.push('Please provide your password!');
    }

    if (email && !validator.isEmail(email)) {
        error.push('Please provide your valid email!');
    }

    if (error.length > 0) {
        res.status(400).json({
            error: { errorMessage: error },
        });
    } else {
        try {
            const checkUser = await registerModel.findOne({ email }).select('+password');

            if (checkUser) {
                const matchPassword = await bcrypt.compare(password, checkUser.password);

                if (matchPassword) {
                    const token = jwt.sign(
                        {
                            id: checkUser._id,
                            email: checkUser.email,
                            userName: checkUser.userName,
                            image: checkUser.image,
                            registerTime: checkUser.createdAt,
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
                        successMessage: 'Your login successfull',
                        token,
                    });
                } else {
                    res.status(400).json({
                        error: { errorMessage: ['Your email or password not match!'] },
                    });
                }
            } else {
                res.status(400).json({
                    error: { errorMessage: ['Your email or password not match!'] },
                });
            }
        } catch (error) {
            res.status(404).json({
                error: { errorMessage: ['Internal server error!'] },
            });
        }
    }
};

module.exports.userLogout = (req, res) => {
    res.status(201).cookie('authToken', '').json({
        success: true,
    });
};
