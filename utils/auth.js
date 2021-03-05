'use strict';
import jwt from 'jsonwebtoken';
import passport from './pass.js';

const login = (req, res) => {
  return new Promise((resolve, reject) => {
    passport.authenticate('local', {session: false},
        async (err, user, info) => {
          try {
            console.log('controller info', info);
            if (err || !user) {
              reject(info.message);
            }
            req.login(user, {session: false}, async (err) => {
              if (err) {
                reject(err);
              }
              // generate a signed son web token with the contents of user object and return it in the response
              const token = jwt.sign(user, 'asd123');
              resolve({user, token});
            });
          } catch (e) {
            reject(e.message);
          }
        })(req, res);
  });
};

const checkAuth = (req, res) => {
  return new Promise((resolve, reject) => {
    passport.authenticate('jwt', (err, user) => {
      console.log('checkAuth', user, err);
      if (err || !user) {
        reject(new Error(err));
      }
      resolve(user);
    })(req, res);
  });
};

export {
  login,
  checkAuth,
};
