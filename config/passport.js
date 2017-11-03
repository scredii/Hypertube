var LocalStrategy     = require('passport-local').Strategy,
    FacebookStrategy  = require('passport-facebook').Strategy,
    FortyTwoStrategy  = require('passport-42').Strategy,
    configAuth        = require('./auth');
    GitHubStrategy    = require('passport-github').Strategy;
    InstagramStrategy = require('passport-instagram').Strategy;
    TwitterStrategy   = require('passport-twitter').Strategy,
    LinkedInStrategy  = require('passport-linkedin').Strategy

module.exports      = function(passport){

  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });



/////////////////////////////////// LINKEDIN OAUTH //////////////////////////////////

passport.use(new LinkedInStrategy({
  consumerKey: configAuth.linkedinAuth.clientID,
  consumerSecret: configAuth.linkedinAuth.clientSecret,
  callbackURL: configAuth.linkedinAuth.callbackURL
},
function(token, tokenSecret, profile, done) {
  User.findOne({ linkedinID: profile.id }, function (err, user) {
    
         if (user)
            return done(null, user);
          else {
            var newUser = fillLinkedinUser(token, profile);
            try {
              newUser.save((err)=>{
                middleware.handleError(err);
                return done(null, newUser);
              });
            } catch (e) {
                console.error(e);
            }
          }
        });
      }
));


  //////////////////////////////// INSTAGRAM OAUTH /////////////////////////////////

passport.use(new InstagramStrategy({
    clientID: configAuth.instagramAuth.clientID,
    clientSecret: configAuth.instagramAuth.clientSecret,
    callbackURL: configAuth.instagramAuth.callbackURL
  },
  function(accessToken, refreshToken, profile, done) {
       process.nextTick(function(){
      User.findOne({instagramID: profile.id}, (err, user)=>{
        if (user)
          return done(null, user);
        else {
          var newUser = fillinstagramUser(profile);

          try {
            newUser.save((err)=>{
              middleware.handleError(err);
              return done(null, newUser);
            });
          } catch (e) {
              console.error(e);
          }
        }
      });
    });
  }
));



/////////////////////////////////// GITHUB OAUTH //////////////////////////////////

passport.use(new GitHubStrategy({
    clientID: configAuth.githubAuth.clientID,
    clientSecret: configAuth.githubAuth.clientSecret,
    callbackURL: configAuth.githubAuth.callbackURL
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOne({ githubID: profile.id }, function (err, user) {

     if (user)
        return cb(null, user);
      else {
        var newUser = fillGithubUser(accessToken, profile);
        try {
          newUser.save((err)=>{
            middleware.handleError(err);
            return cb(null, newUser);
          });
        } catch (e) {
            console.error(e);
        }
      }
    });
  }
));


////////////////////////////////////LOCAL SIGNIN/////////////////////////////////
  passport.use('local-signin', new LocalStrategy({
      passReqToCallback : true
    },
    function (req, username, password, done){
      User.findOne({'login': req.body.username}, (err, user)=>{
        if (user)
          return done(null, false, req.flash('signinMessage', 'That username is already taken.'));
        else {
          User.findOne({'email': req.body.mail}, (err, user)=>{
            if (user)
              return done(null, false, req.flash('signinMessage', 'That email is already taken.'));
            else {
              var newUser = fillUser(req, username, password);

              try {
                newUser.save((err)=>{
                  middleware.handleError(err);
                  // console.log(newUser);
                  return done(null, newUser);
                });
              } catch (e) {
                  console.error(e);
              }
            }
          });
        }
      });
    }
  ));
////////////////////////////////////LOCAL SIGNIN/////////////////////////////////
////////////////////////////////////LOCAL LOGIN/////////////////////////////////
  passport.use('local-login', new LocalStrategy({
      passReqToCallback: true
    },
    function (req, username, password, done){
      User.findOne({'login': username}, (err, user)=>{
        if (!user){
          return done(null, false, req.flash('loginMessage', 'No user found.'));
        }

        if (!user.validPassword(password)){
          return done(null, false, req.flash('loginMessage', 'Wrong username/password combination.'));
        }

        return done(null, user);
      });
    }
  ));
////////////////////////////////////LOCAL LOGIN/////////////////////////////////

// =========================================================================
// FACEBOOK ================================================================
// =========================================================================

passport.use(new FacebookStrategy({
    clientID        : configAuth.facebookAuth.clientID,
    clientSecret    : configAuth.facebookAuth.clientSecret,
    callbackURL     : configAuth.facebookAuth.callbackURL,
    profileFields   : ['id', 'picture.width(750).height(750)', 'name', 'emails']
  },

  function (token, refreshToken, profile, done) {
    process.nextTick(function(){
      User.findOne({facebookID: profile.id}, (err, user)=>{
        if (user)
          return done(null, user);
        else {
          var newUser = fillFacebookUser(token, profile);

          try {
            newUser.save((err)=>{
              middleware.handleError(err);
              return done(null, newUser);
            });
          } catch (e) {
              console.error(e);
          }
        }
      });
    });
  }
));

// =========================================================================
// TWITTER =================================================================
// =========================================================================

passport.use(new TwitterStrategy({
    consumerKey     : configAuth.twitterAuth.clientID,
    consumerSecret  : configAuth.twitterAuth.clientSecret,
    callbackURL     : configAuth.twitterAuth.callbackURL
  },
  function (token, refreshToken, profile, done) {
    process.nextTick(function(){
      User.findOne({twitterID: profile.id}, (err, user)=>{
        if (user)
          return done(null, user);
        else {
          var newUser = fillTwitterUser(token, profile);

          try {
            newUser.save((err)=>{
              middleware.handleError(err);
              return done(null, newUser);
            });
          } catch (e) {
              console.error(e);
          }
        }
      });
    });
  }
));

// =========================================================================
// INTRA 42 ================================================================
// =========================================================================

passport.use(new FortyTwoStrategy({
  clientID        : configAuth.intraAuth.clientID,
  clientSecret    : configAuth.intraAuth.clientSecret,
  callbackURL     : configAuth.intraAuth.callbackURL
  },
  function (token, refreshToken, profile, done){
    User.findOne({intraID: profile.id}, (err, user)=>{
      if (user)
        return done(null, user);
      else {
        var newUser = fillIntraUser(token, profile);

        try {
          newUser.save((err)=>{
            middleware.handleError(err);
            return done(null, newUser);
          });
        } catch (e) {
            console.error(e);
        }
      }
    });
  }
));

};

function fillUser(req, username, password){
  var newUser = new User();

  newUser.login     = xss(username);
  newUser.email     = xss(req.body.mail);
  newUser.password  = newUser.generateHash(password);
  newUser.name      = xss(req.body.name);
  newUser.firstName = xss(req.body.firstname);
  newUser.language  = req.body.language;
  return newUser;
}

function fillFacebookUser(token, profile){
  var newUser = new User();

  newUser.login       = profile.name.givenName + " " + profile.name.familyName;
  newUser.facebookID  = profile.id;
  newUser.token       = token;
  newUser.name        = profile.name.familyName;
  newUser.firstName   = profile.name.givenName;
  newUser.email       = profile.emails[0].value;
  newUser.photo       = profile.photos[0].value;
  return newUser;
}

function fillIntraUser(token, profile){
  var newUser = new User();

  newUser.login       = profile.username;
  newUser.intraID     = profile.id;
  newUser.token       = token;
  newUser.name        = profile.name.familyName;
  newUser.firstName   = profile.name.givenName;
  newUser.email       = profile.emails[0].value;
  newUser.photo       = profile.photos[0].value;
  return newUser;
}

function fillGithubUser(token, profile){
  var newUser = new User();

  newUser.login       = profile.username;
  newUser.githubID    = profile.id;
  newUser.token       = token;
  if (profile.displayName){
    newUser.firstName   = profile.displayName.split(' ')[0];
    newUser.name        = profile.displayName.split(' ')[1];
  }
  else{
    newUser.firstName   = profile.username;
    newUser.name        = profile.username;
  }
  newUser.email       = profile._json.email;
  newUser.photo       = profile.photos[0].value;
  return newUser;
}

function fillinstagramUser( profile){
  var newUser = new User();

  newUser.login       = profile.username;
  newUser.instagramID = profile.id;
  //WE DONT HAVE TOKEN
  // newUser.token       = token;
  if (profile._json.data.full_name){
    newUser.firstName   = profile._json.data.full_name.split(' ')[0];
    newUser.name        = profile._json.data.full_name.split(' ')[1];
  }
  else{
    newUser.firstName   = profile.username;
    newUser.name        = profile.username;
  }
  //WE DONT HAVE EMAIL IN JSON SO TMP MAIL GENERATED
  newUser.email       = profile.username + '@tmp.fr';
  newUser.photo       = profile._json.data.profile_picture;
  return newUser;
}

function fillTwitterUser(token, profile){
  var newUser = new User();
  // console.log(profile)
  newUser.login       = profile.username;
  newUser.twitterID   = profile.id;
  newUser.token       = token;
  newUser.name        = profile.displayName;
  newUser.firstName   = profile.displayName;
  newUser.email       = profile.username + "@tmp.fr";
  newUser.photo       = profile.photos[0].value;
  return newUser;
}

function fillLinkedinUser(token, profile){
  var newUser = new User();
  newUser.login       = profile.displayName;
  newUser.linkedinID  = profile.id;
  newUser.token       = token;
  newUser.name        = profile.name.familyName;
  newUser.firstName   = profile.name.givenName;
  newUser.email       = profile.name.givenName + "@tmp.fr";
  // newUser.photo       = profile.photos[0].value;
  return newUser;
}
