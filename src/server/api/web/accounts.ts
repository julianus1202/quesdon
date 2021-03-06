import * as Router from "koa-router"
import * as mongoose from "mongoose"
import { User, Question } from "../../db/index";
import fetch from "node-fetch";
import * as parseLinkHeader from "parse-link-header"
import { Links, Link } from "parse-link-header";

var router = new Router

router.get("/verify_credentials", async ctx => {
    if (!ctx.session!.user) return ctx.throw("please login", 403)
    const user = await User.findById(ctx.session!.user)
    if (!user) return ctx.throw("not found", 404)
    ctx.body = user
})

router.get("/followers", async ctx => {
    if (null == /^\d+$/.exec(ctx.query.max_id || "0")) return ctx.throw("max_id is num only", 400)
    if (!ctx.session!.user) return ctx.throw("please login", 403)
    const user = await User.findById(ctx.session!.user)
    if (!user) return ctx.throw("not found", 404)
    const myInfo = await fetch("https://"+user!.acct.split("@")[1]+"/api/v1/accounts/verify_credentials", {
        headers: {
            Authorization: "Bearer "+user!.accessToken,
        }
    }).then(r => r.json())
    var followersRes = await fetch("https://"+user!.acct.split("@")[1]+"/api/v1/accounts/"+myInfo.id+"/followers?limit=80" + (ctx.query.max_id ? "&max_id="+ctx.query.max_id : ""), {
        headers: {
            Authorization: "Bearer "+user!.accessToken,
        }
    })
    var followers: any[] = await followersRes.json()
    followers = followers
        .map(follower => follower.acct as string)
        .map(acct => ~acct.indexOf("@") ? acct : (acct + "@" + user!.acct.split("@")[1]))
        .map(acct => acct.toLowerCase())
    const followersObject = await User.find({acctLower: {$in: followers}})
    const max_id = ((parseLinkHeader(followersRes.headers.get("Link")) || {} as Links).next || {} as Link).max_id
    ctx.body = {
        accounts: followersObject,
        max_id
    }
})

router.post("/update", async ctx => {
    if (!ctx.session!.user) return ctx.throw("please login", 403)
    const user = await User.findById(ctx.session!.user)
    if (!user) return ctx.throw("not found", 404)
    user.description = ctx.request.body.fields.description
    user.questionBoxName = ctx.request.body.fields.questionBoxName
    await user.save()
    ctx.body = {status: "ok"}
})

router.get("/id/:id", async ctx => {
    const user = await User.findById(ctx.params.id)
    if (!user) return ctx.throw("not found", 404)
    ctx.body = user
})


router.get("/:acct", async ctx => {
    const user = await User.findOne({acctLower: ctx.params.acct.toLowerCase()})
    if (!user) return ctx.throw("not found", 404)
    ctx.body = user
})

router.post("/:acct/question", async ctx => {
    const questionString = ctx.request.body.fields.question
    if (questionString.length > 200) return ctx.throw("too long", 400)
    const user = await User.findOne({acctLower: ctx.params.acct.toLowerCase()})
    if(!user) return ctx.throw("not found", 404)
    var question = new Question
    question.question = questionString
    question.user = user
    await question.save()
    ctx.body = {status: "ok"}
})

router.get("/:acct/questions", async ctx => {
    const user = await User.findOne({acctLower: ctx.params.acct.toLowerCase()})
    if(!user) return ctx.throw("not found", 404)
    const questions = await Question.find({
        user,
        answeredAt: {$ne: null}
    }).sort("-answeredAt")
    ctx.body = questions
})


export default router