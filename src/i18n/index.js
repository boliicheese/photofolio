const bioEs = [
  'Hace más de siete años empecé a tomar fotos sin más plan que el de mirar mejor. Con el tiempo se volvió una práctica constante: la forma más directa que encontré de ser creativo y de devolverle atención a lo que muchas veces pasa desapercibido.',
  'Mi trabajo se mueve entre el retrato, el paisaje, la fotografía de calle, los viajes y la naturaleza. También fotografío perros con regularidad — los míos y los que se cruzan en el camino. Busco una estética minimalista y natural: poca intervención, luz disponible, encuadre limpio. Que la imagen funcione por lo que hay, no por lo que se le agrega.',
  'Trabajo principalmente con una Sony α6700, complementada con iPhone 16 Pro Max e Insta360 X4 según lo que pida la escena.',
  'Si te interesa colaborar, encargar un retrato o conversar sobre un proyecto, escríbeme. Respondo personalmente.',
];

const bioEn = [
  'Over seven years ago I started taking photos with no plan other than to look more carefully. Over time it became a constant practice: the most direct way I found to be creative and to return attention to what often goes unnoticed.',
  "My work moves between portraiture, landscape, street photography, travel, and nature. I also photograph dogs regularly — mine and the ones I meet along the way. I look for a minimalist, natural aesthetic: minimal intervention, available light, clean framing. The image works because of what's there, not what's added to it.",
  'I work primarily with a Sony α6700, complemented by an iPhone 16 Pro Max and Insta360 X4 depending on what the scene calls for.',
  "If you're interested in collaborating, commissioning a portrait, or discussing a project, reach out. I respond personally.",
];

export const i18n = {
  es: {
    meta: {
      home:               'Bolivar Barrios — Fotografía desde Panamá',
      gallery:            'Galería — Bolivar Barrios',
      collections:        'Colecciones — Bolivar Barrios',
      about:              'Sobre mí — Bolivar Barrios',
      contact:            'Contacto — Bolivar Barrios',
      adminLogin:         'Login — Admin',
      adminDashboard:     'Dashboard — Admin',
      adminPhotos:        'Fotos — Admin',
      adminUpload:        'Subir fotos — Admin',
      adminCollections:   'Colecciones — Admin',
      adminSubmissions:   'Mensajes — Admin',
      adminCarousel:      'Carrusel — Admin',
    },
    nav: {
      gallery: 'Galería', collections: 'Colecciones', about: 'Sobre mí', contact: 'Contacto',
    },
    home: {
      tagline: 'Fotografía desde Panamá.', viewGallery: 'Ver galería →',
    },
    gallery: {
      empty: 'La galería está vacía por el momento.', viewPhoto: 'Ver foto',
    },
    collections: {
      title: 'Colecciones',
      empty: 'No hay colecciones todavía.',
      photoCount: (n) => `${n} foto${n !== 1 ? 's' : ''}`,
    },
    collection: {
      back: '← Colecciones', empty: 'Esta colección está vacía.',
    },
    about: {
      role: 'Fotógrafo · Ciudad de Panamá',
      bioParagraphs: bioEs,
      cta: 'contacto →',
      gear: 'Equipo',
    },
    contact: {
      title: 'Escríbeme',
      name: 'Nombre', email: 'Email', message: 'Mensaje', send: 'Enviar',
      success: 'Mensaje enviado. Te respondo personalmente.',
      validationError: 'Por favor revisa los campos del formulario.',
      rateLimit: 'Demasiados intentos. Intenta de nuevo en 15 minutos.',
    },
    error: { backHome: 'Volver al inicio' },
    admin: {
      nav: {
        photos: 'Fotos', upload: 'Subir', collections: 'Colecciones',
        messages: 'Mensajes', carousel: 'Carrusel', logout: 'Salir',
      },
      login: {
        password: 'Contraseña', submit: 'Entrar',
        required: 'Email y contraseña requeridos.',
        invalid: 'Email o contraseña incorrectos.',
      },
      dashboard: {
        photos: 'fotos', collections: 'colecciones', unread: 'mensajes sin leer',
        uploadPhotos: 'Subir fotos', viewMessages: 'Ver mensajes', viewSite: 'Ver sitio →',
      },
      photos: {
        uploadBtn: '+ Subir', empty: 'No hay fotos todavía.', uploadFirst: 'Sube la primera.',
        edit: 'Editar', delete: 'Eliminar', save: 'Guardar', cancel: 'Cancelar',
        titleField: 'Título', location: 'Ubicación', date: 'Fecha', order: 'Orden',
        caption: 'Caption', tags: 'Tags (separados por coma)', noCollection: '— Sin colección —',
        featureLabel: 'Featured',
        confirmDelete: '¿Eliminar esta foto? Esta acción no se puede deshacer.',
        errSave: 'Error al guardar.', errDelete: 'Error al eliminar.',
      },
      upload: {
        dragHint: 'Arrastra fotos aquí o', browse: 'selecciona archivos',
        hint: 'JPEG o PNG · máx 25 MB por archivo',
        titleField: 'Título', location: 'Ubicación', date: 'Fecha',
        noCollection: '— Sin colección —', tags: 'Tags (separados por coma)',
        uploadAll: 'Subir todas',
        getting: 'Obteniendo URL…', uploading: 'Subiendo…', processing: 'Procesando…',
        done: '✓ Listo', errStart: '✕ Error al iniciar subida.',
        errS3: '✕ Error al subir a S3.', errComplete: '✕ Error al registrar la foto.',
        onlyJpegPng: 'solo JPEG y PNG.', maxSize: 'máximo 25 MB.',
      },
      collections: {
        new: '+ Nueva', name: 'Nombre', slug: 'Slug (URL)', order: 'Orden',
        description: 'Descripción', create: 'Crear', cancel: 'Cancelar', delete: 'Eliminar',
        empty: 'No hay colecciones todavía.',
        confirmDelete: '¿Eliminar esta colección?',
        errCreate: 'Error al crear colección. Verifica que el slug sea único.',
        errDelete: 'Error al eliminar.',
      },
      submissions: {
        empty: 'No hay mensajes todavía.', markRead: 'Marcar leído',
      },
      carousel: {
        subtitle: 'Selecciona hasta 5 fotos para el hero. El orden define la secuencia.',
        position: 'Posición', empty: 'Vacío', select: 'Seleccionar', change: 'Cambiar',
        remove: '✕', pickTitle: 'Foto para posición', noPhotos: 'No hay fotos disponibles.',
        cancel: 'Cancelar', errAssign: 'Error al asignar foto.', errRemove: 'Error al quitar foto.',
      },
    },
  },

  en: {
    meta: {
      home:               'Bolivar Barrios — Photography from Panama',
      gallery:            'Gallery — Bolivar Barrios',
      collections:        'Collections — Bolivar Barrios',
      about:              'About — Bolivar Barrios',
      contact:            'Contact — Bolivar Barrios',
      adminLogin:         'Login — Admin',
      adminDashboard:     'Dashboard — Admin',
      adminPhotos:        'Photos — Admin',
      adminUpload:        'Upload photos — Admin',
      adminCollections:   'Collections — Admin',
      adminSubmissions:   'Messages — Admin',
      adminCarousel:      'Carousel — Admin',
    },
    nav: {
      gallery: 'Gallery', collections: 'Collections', about: 'About', contact: 'Contact',
    },
    home: {
      tagline: 'Photography from Panama.', viewGallery: 'View gallery →',
    },
    gallery: {
      empty: 'The gallery is empty for now.', viewPhoto: 'View photo',
    },
    collections: {
      title: 'Collections',
      empty: 'No collections yet.',
      photoCount: (n) => `${n} photo${n !== 1 ? 's' : ''}`,
    },
    collection: {
      back: '← Collections', empty: 'This collection is empty.',
    },
    about: {
      role: 'Photographer · Panama City',
      bioParagraphs: bioEn,
      cta: 'contact →',
      gear: 'Equipment',
    },
    contact: {
      title: 'Get in touch',
      name: 'Name', email: 'Email', message: 'Message', send: 'Send',
      success: "Message sent. I'll get back to you personally.",
      validationError: 'Please review the form fields.',
      rateLimit: 'Too many attempts. Please try again in 15 minutes.',
    },
    error: { backHome: 'Back to home' },
    admin: {
      nav: {
        photos: 'Photos', upload: 'Upload', collections: 'Collections',
        messages: 'Messages', carousel: 'Carousel', logout: 'Sign out',
      },
      login: {
        password: 'Password', submit: 'Sign in',
        required: 'Email and password are required.',
        invalid: 'Incorrect email or password.',
      },
      dashboard: {
        photos: 'photos', collections: 'collections', unread: 'unread messages',
        uploadPhotos: 'Upload photos', viewMessages: 'View messages', viewSite: 'View site →',
      },
      photos: {
        uploadBtn: '+ Upload', empty: 'No photos yet.', uploadFirst: 'Upload the first one.',
        edit: 'Edit', delete: 'Delete', save: 'Save', cancel: 'Cancel',
        titleField: 'Title', location: 'Location', date: 'Date', order: 'Order',
        caption: 'Caption', tags: 'Tags (comma separated)', noCollection: '— No collection —',
        featureLabel: 'Featured',
        confirmDelete: 'Delete this photo? This action cannot be undone.',
        errSave: 'Error saving.', errDelete: 'Error deleting.',
      },
      upload: {
        dragHint: 'Drag photos here or', browse: 'select files',
        hint: 'JPEG or PNG · max 25 MB per file',
        titleField: 'Title', location: 'Location', date: 'Date',
        noCollection: '— No collection —', tags: 'Tags (comma separated)',
        uploadAll: 'Upload all',
        getting: 'Getting URL…', uploading: 'Uploading…', processing: 'Processing…',
        done: '✓ Done', errStart: '✕ Error starting upload.',
        errS3: '✕ Error uploading to S3.', errComplete: '✕ Error saving photo.',
        onlyJpegPng: 'JPEG and PNG only.', maxSize: 'maximum 25 MB.',
      },
      collections: {
        new: '+ New', name: 'Name', slug: 'Slug (URL)', order: 'Order',
        description: 'Description', create: 'Create', cancel: 'Cancel', delete: 'Delete',
        empty: 'No collections yet.',
        confirmDelete: 'Delete this collection?',
        errCreate: 'Error creating collection. Make sure the slug is unique.',
        errDelete: 'Error deleting.',
      },
      submissions: {
        empty: 'No messages yet.', markRead: 'Mark as read',
      },
      carousel: {
        subtitle: 'Select up to 5 photos for the hero. Order defines the sequence.',
        position: 'Position', empty: 'Empty', select: 'Select', change: 'Change',
        remove: '✕', pickTitle: 'Photo for position', noPhotos: 'No photos available.',
        cancel: 'Cancel', errAssign: 'Error assigning photo.', errRemove: 'Error removing photo.',
      },
    },
  },
};
