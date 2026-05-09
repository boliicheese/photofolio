export function getAbout(req, res) {
  res.render('about', { title: res.locals.t.meta.about });
}
