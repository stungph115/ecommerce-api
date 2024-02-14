import { Injectable } from '@nestjs/common';
const moment = require('moment')
const nodemailer = require("nodemailer")
import { env } from '../../env'
import { User } from 'src/user/user.entity'
import { InjectRepository } from '@nestjs/typeorm'
import { In, Repository } from 'typeorm'

const transporter = nodemailer.createTransport({
    service: "Gmail",
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: "gmail@gmail.com",
        pass: "your_app_password",
    },
})

const resetPasswordTemplateHtml = `
    <div style="background-color: #f2f2f2; padding: 20px;">
        <div style="background-color: #ffffff; border-radius: 10px; padding: 20px; text-align: center;">
            <h1 style="font-size: 24px; margin-bottom: 30px;">Demande de réinitialisation du mot de passe</h1>
            <p style="font-size: 16px; text-align: left; margin-bottom: 30px;">Bonjour #username#,</p>
            <p style="font-size: 16px; text-align: left; margin-bottom: 30px;">Vous avez récemment demandé la réinitialisation du mot de passe de votre compte Ticketing. Cliquez sur le bouton ci-dessous pour continuer.</p>
            <div style="text-align: center; margin-bottom: 10;">
                <a href="#BASE_URL#reset-password/#tokenResetPassword#" style="background-color: #007bff; border-radius: 5px; color: #ffffff; font-size: 16px; text-decoration: none; padding: 10px 20px; display: inline-block;" target="_blank">Réinitialiser le mot de passe</a>
            </div>
            <p style="font-size: 16px; text-align: center; margin-bottom: 20px; color: red;">*Votre demande expirera dans 15 minutes, ne partagez pas ce lien avec quelqu'un d'autre !</p>
        </div>
        <p style="font-size: 16px; text-align: left; margin-bottom: 30px; color: red; font-weight: bold;">*Attention: Si vous n'avez pas demandé de réinitialisation de mot de passe, veuillez ignorer cet e-mail ou répondre pour nous en informer.</p>
    </div>
`
const errorEmailTemplateHtml = `
    <h2>Error while trying to send an email to : #to#</h2>
    <p>Error Message : #err#</p>
`
@Injectable()
export class MailerService {

    async sendResetPasswordEmail(username, tokenResetPassword, to) {
        try {
            const html = resetPasswordTemplateHtml.replace(/#username#/g, username).replace(/#tokenResetPassword#/g, tokenResetPassword).replace(/#BASE_URL#/g, env.BASE_URL)
            const params = {
                from: '',
                to,
                subject: 'Ecommerce - Réinitialisation de mot de passe',
                html,
            }
            await transporter.sendMail(params)
        } catch (err) {
            await this.sendErrorMail(err.toString(), to)
        }
    }

    private async sendErrorMail(err, to) {
        await transporter.sendMail({
            from: '',
            to: '',
            subject: 'An error happened while trying to send an email',
            html: errorEmailTemplateHtml.replace(/#err#/g, err).replace(/#to#/g, to)
        })
    }
}
