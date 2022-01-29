const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const Favorites = require('../models/favorites');
const Dishes = require('../models/dishes');
const favoriteRouter = express.Router();
const authenticate = require('../authenticate');
const cors = require('./cors');

favoriteRouter.use(bodyParser.json());

favoriteRouter.route('/')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.corsWithOptions, authenticate.verifyUser, (req,res,next) => {
    Favorites.find({user: req.user.id})
    .populate('user')
    .populate({path: 'dishes', model: 'Dish'})
    .then((favorites) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(favorites);
    }, (err) => next(err))
    .catch((err) => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser, async(req, res, next) => {
    var dishes = await Dishes.find({_id: { $in: req.body }});
    if(dishes.length == 0){
        err = new Error('Dishes not found');
        err.status = 404;
        return next(err);
    }
    else{   
        Favorites.findOne({user: req.user.id})
        .then((favorites) => {
            if (!favorites){
                var favorite = {user: req.user._id, dishes: []};
                dishes.forEach(dish => {
                    if(JSON.stringify(favorite.dishes).indexOf(dish._id) === -1){
                        favorite.dishes.push(dish);
                    }
                });
                Favorites.create(favorite)
                .then((newFavorite) =>{
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(newFavorite);
                }, (err) => next(err))
                .catch((err) => next(err));
            }
            else {
                dishes.forEach(dish => {
                    if(favorites.dishes.indexOf(dish._id) === -1)
                        favorites.dishes.push(dish);
                });
                favorites.save()
                .then((newFavorite) => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(newFavorite);
                }, (err) => next(err))
                .catch((err) => next(err));
            }
        }, (err) => next(err))
        .catch((err) => next(err));
    }
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /favorites');
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.remove({user: req.user.id})
    .then((resp) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(resp);
    }, (err) => next(err))
    .catch((err) => next(err));    
});

favoriteRouter.route('/:dishId')
.options(cors.corsWithOptions, authenticate.verifyUser, (req, res) => { res.sendStatus(200); })
.get(cors.cors, (req,res,next) => {
    res.statusCode = 403;
    res.end('GET operation not supported on /dishes/'+ req.params.dishId);
})
.post(cors.corsWithOptions, authenticate.verifyUser, async(req, res, next) => {
    var dish = await Dishes.findById(req.params.dishId);
    if(!dish){
        err = new Error('Dish ' + req.params.dishId + ' not found');
        err.status = 404;
        return next(err);
    }
    else{
        Favorites.findOne({user: req.user.id})
        .then((favorites) => {
            if (!favorites){
                var favorite = {user: req.user._id, dishes: []};
                var dish = {_id: req.params.dishId};
                favorite.dishes.push(dish);
                Favorites.create(favorite)
                .then((newFavorite) =>{
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(newFavorite);
                }, (err) => next(err))
                .catch((err) => next(err));
            }
            else {
                if(favorites.dishes.indexOf(req.params.dishId) === -1){
                    var dish = {_id: req.params.dishId};
                    favorites.dishes.push(dish);
                    favorites.save()
                    .then((newFavorite) => {
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.json(newFavorite);
                    }, (err) => next(err))
                    .catch((err) => next(err));
                }
                else{
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(favorites);
                }
            }
        }, (err) => next(err))
        .catch((err) => next(err));
    }
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /dishes/'+ req.params.dishId);
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({user: req.user._id})
    .then((favorites) => {
        if (!favorites){
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(resp);
        }
        else {
            var index = favorites.dishes.indexOf(req.params.dishId);
            if (index !== -1) {
                favorites.dishes.splice(index, 1);
                favorites.save()
                .then((newFavorite) => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(newFavorite);
                }, (err) => next(err))
                .catch((err) => next(err));
            }
            else{
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favorites);
            }
        }
    }, (err) => next(err))
    .catch((err) => next(err));
});

module.exports = favoriteRouter;