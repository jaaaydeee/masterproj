const JwtStragety = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const config = require('./database');
const user_model = require('../models/User_model');

module.exports = function(passport) {
    console.log('Passport initializing');
    let opts = {};
    opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
    opts.secretOrKey = config.secret;
    opts.ignoreExpiration = true;
    passport.use(new JwtStragety(opts, (jwt_payload, done) => {
        user_model.validateUser(); //email, password, callback

        User.getUserById(jwt_payload._id, (err, user)=>{
            if(err)
            {
                return done(err, false);
            }
            if(user)
            {
                return done(null, user);
            }
            else{
                return done(null, false);
            }
        });
    }));
}