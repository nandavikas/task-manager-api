const express = require('express')
const router = express.Router()
const Task = require('../models/tasks.js')
const auth = require('../middleware/auth.js')

router.post('/tasks', auth, async (req, res)=>{
    const task = await new Task({
        ...req.body,
        owner: req.user._id
    })
    try{
        await task.save()
        res.status(201).send(task)
    }catch(e){
        res.status(400).send(e)
    }
})


//Get /tasks?completed=boolean
//Get /tasks?limit=10&skip=0
router.get('/tasks', auth, async (req, res)=>{
    // const tasks = await Task.find({owner: req.user._id})
    const match = {}
    const sort = {}
    if(req.query.completed){
        match.completed = req.query.completed === 'true'
    }

    if(req.query.sortBy){
        const parts = req.query.sortBy.split(':')
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
    }

    try{
        await req.user.populate({
            'path': 'tasks',
            match,
            'options':{
                'limit': parseInt(req.query.limit),
                'skip': parseInt(req.query.skip),
                sort
            }
        }).execPopulate()
        res.send(await req.user.tasks)
    }catch(e){
        res.status(500).send(e)
    }
})

router.get('/tasks/:id', auth, async(req, res)=>{
    const _id = req.params.id
    try{
        const task = await Task.findOne({_id, owner: req.user._id})
        if(!task){
            return res.status(404).send()
        }
        res.send(task)
    }catch(e){
        res.status(500).send(e)
    }
})

router.patch('/tasks/:id', auth, async (req, res)=>{
    const _id = req.params.id
    const updates = Object.keys(req.body)
    const allowedUpdates = ['description','completed']
    const isValidOperation = updates.every(update=> allowedUpdates.includes(update))

    if(!isValidOperation){
        return res.status(404).send({'Error': 'Invalid operation'})
    }

    try{
        const task = await Task.findOne({ _id, owner: req.user._id})
        if(!task){
            return res.status(404).send()
        }
        await updates.forEach(update=>task[update]=req.body[update])
        await task.save()
        res.send(task)
    }
    catch(e){
        res.status(404).send(e)
    }
})

router.delete('/tasks/:id', auth, async (req, res)=>{
    try{
        const _id = req.params.id
        const task = await Task.findOneAndDelete({ _id, owner: req.user._id })
        if(!task){
            return res.status(404).send()
        }
        res.send(task)
    }catch(e){
        res.status(500).send(e)
    }
})

module.exports = router