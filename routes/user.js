router.get('/user/:id', middleware.loggedIn(), (req, res)=>{
  var id = req.params.id;
  try {
    User.findOne({_id: id}, (err, profile)=>{
      middleware.handleError(err);
      if (profile)
        return res.render('user/profile', {title: profile.login, user: req.user, profile: profile, message: req.flash('profileMessage')});
      res.redirect('/404');
    });
  } catch (e) {
    // console.log(e);
    res.redirect('/404');
  }
});

router.post('/user/edit', middleware.loggedIn(), (req, res)=>{
  var user      = req.user,
      updateUser  = {
        login     : xss(req.body.login),
        email     : xss(req.body.email),
        name      : xss(req.body.name),
        firstName : xss(req.body.firstName),
        language  : xss(req.body.language)
    }
    User.findOneAndUpdate({_id: user._id}, updateUser, (err, result)=>{
      if (result)
      {
        req.user.login      = updateUser.login;
        req.user.email      = updateUser.email;
        req.user.name       = updateUser.name;
        req.user.firstName  = updateUser.firstName;
        req.user.language   = updateUser.language;
        req.flash('profileMessage', "Your profile has been updated !");
      }
      res.redirect('/user/'+ req.user._id);
    });

});

router.post('/user/changepicture', middleware.loggedIn(), (req, res)=>{
  var user = req.user,
      newPhoto  = xss(req.body.photo);
  User.findOneAndUpdate({_id: user._id}, {photo: newPhoto}, (err, result)=>{
    if (result)
      req.flash('profileMessage', "Your profile picture has been updated !");
    res.redirect('/user/'+user._id);
  })
});

module.exports = router;
