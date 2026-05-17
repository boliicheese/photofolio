export function getAbout(req, res) {
  res.render('about', {
    title:       res.locals.t.meta.about,
    description: 'Bolivar Barrios — fotógrafo en Ciudad de Panamá. Retrato, paisaje, calle y naturaleza. Más de siete años capturando lo que pasa desapercibido.',
    canonical:   'https://bolivarbarrios.work/about',
  });
}
