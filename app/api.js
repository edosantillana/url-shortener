var model = require('./models/url');
var validator = require('validator');
var url = require("url");
var base62 = require("base62"); //codificador de base 62 (0-9, a-z, A-Z)

module.exports = function(app, db, dirname) {
    db.on  ('error', console.error.bind(console, 'connection error:'));

    db.once('open' , function() {
        var host = '';

        app.route('/new/*')
            .get(function(req, res) {
            host = getHost(req) + '/';

            var id = req.url.substring(5);

            if(validator.isURL(id, {require_protocol: true})) {
                model.findOne({original: id}, {_id: 0, __v: 0}, function(err, urlName) {
                    if(err)
                        console.error(err.message);
                    if(urlName) { //Si es true, envía json con información
                        //la base de datos contiene la url original,
                        //junto con la variable en base 62 que le corresponde.
                        //Cuando responde, el servidor agrega el host al documento json.
                        var obj = {original_url: urlName.original, short_url: host + urlName.short}
                        res.json(obj);
                    }
                    else { //Si no, crea y envía el documento json
                        model.count({}, function(err, count) {
                            if(err)
                                throw err;

                                //La base de datos contiene la url original,
                                //junto con la variable en base 62 que le corresponde.
                                //Cuando responde, el servidor agrega el host al documento json.
                            var urlName = new model({original: id, short: base62.encode(count).toString()});
                            urlName.save();

                            res.json({original_url: urlName.original, short_url: host + urlName.short});
                        });
                    }
                });
            }
            else {
                //Si el usuario ingresa una url no válida, el documento json devuelve un mensaje de error.
                var obj = {error: "Invalid url"};
                res.json(obj);
            }
        });

        app.route('/:id')
            .get(function(req, res) {
                var id = req.params.id;

                //check if already exists
                //if yes, redirect
                //if no, 404 page
                model.findOne({short: id}, function(err, urlName) {
                    if(err)
                        console.error(err.message);

                    if(urlName)
                        res.redirect(urlName.original);
                    else
                        res.status(404);
                });
            });
    });

    function getHost(req) {
        return url.format({
            protocol: req.protocol,
            host: req.get('host'),
          });
    }
};
