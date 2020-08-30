const express = require('express')
const User = require('../models/users.js')
const auth = require('../middleware/auth.js')
const { sendWelcomeEmail, sendRemovalEmail } = require('../emails/account.js')
const multer = require('multer')
const sharp = require('sharp')
const router = express.Router()



router.post('/users',async (req, res)=>{
    const user = new User(req.body)
    try{
        await user.save()
        sendWelcomeEmail(user.email, user.name)
        const token = await user.generateAuthToken()
        res.status(201).send({ user: await user.getPublicProfile(), token })
    }catch(e){
        res.status(404).send(e)
    }
})

router.post('/users/login',async (req, res)=>{
    try{
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        res.send({ user: await user.getPublicProfile(), token })
    }catch(e){
        res.status(400).send()
    }
})

router.post('/users/logout', auth, async (req, res)=>{
    try{
        req.user.tokens = req.user.tokens.filter(token => token.token !== req.token)
        await req.user.save()

        res.send()
    }catch(e){
        res.status(500).send(e)
    }
})

router.post('/users/logoutAll', auth , async (req, res)=>{
    try{
        req.user.tokens = []
        await req.user.save()

        res.send()
    }catch(e){
        res.status(500).send(e)
    }
})

router.get('/users/me',auth, async (req, res)=>{
    res.send(await req.user.getPublicProfile())
})

const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb){
        if(!file.originalname.match(/\.(jpg|png|jpeg)$/gi)){
            return cb(new Error('Please upload an image'))
        }
        cb(undefined,true)
    }
})

router.post('/users/me/avatar', auth, upload.single('avatar'),async (req, res)=>{
    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer()
    req.user.avatar = buffer
    await req.user.save()
    res.send()
},(error, req, res, next)=>{
    res.status(400).send({ error: error.message})
})

router.delete('/users/me/avatar', auth, async (req, res)=>{
    req.user.avatar = undefined
    await req.user.save()
    res.send()
})

router.get('/users/:id/avatar', async (req, res)=>{
    try{
        const user = await User.findById(req.params.id)
        if(!user || !user.avatar){
            throw new Error()
        }
        res.set('Content-Type','image/png')
        res.send(user.avatar)
    }catch(e){
        res.status(400).send()
    }
})


router.patch('/users/me', auth, async (req, res)=>{
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name','email','age','password']
    const isValidOperation = updates.every(update=> allowedUpdates.includes(update))

    if(!isValidOperation){
        return res.status(404).send({'Error': 'Invalid operation'})
    }

    try{
        updates.forEach(update => req.user[update]=req.body[update])
        await req.user.save()
        res.send(await req.user.getPublicProfile())
    }catch(e){
        res.status(400).send(e)
    }
})

router.delete('/users/me', auth, async(req, res)=>{
    try{
        sendRemovalEmail(req.user.email, req.user.name)
        await req.user.remove()
        res.send(await req.user.getPublicProfile())
    }catch(e){
        res.status(500).send(e)
    }
})

module.exports = router