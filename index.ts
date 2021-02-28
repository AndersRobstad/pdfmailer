import * as fs from 'fs';
import * as path from 'path';
import * as prompt from 'prompt';
import * as nodemailer from 'nodemailer';
import * as commandLineArgs from 'command-line-args';

//Path to the credentials.
import * as creds from 'PATH TO CREDENTIALS';

//Attendees downloaded from the OW event renamed to attendees.json.
import * as attendees from './input/attendees.json';

// DUMB SHIT to get "10.pdf" after "2.pdf"
const collator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: 'base',
});

// Read stuff from ARGS
const args = commandLineArgs([
  { name: 'from', alias: 'f', type: String },
  { name: 'occation', alias: 'o', type: String },
  { name: 'from_email', alias: 'e', type: String },
  { name: 'pdfs', alias: 'p', type: String },
  { name: 'emails', alias: 'm', type: String },
]);

/* Create transporter with OAuth2
 *
 * This can be swapped with a SMTP transporter as shown below.
 * Then you also need to make some changes with the `env` code above
 * to make it read the SMTP_URL instead of the GOOGLE_CREDENTIALS, but
 * that should be no problem :)
 *
 * const transporter = nodemailer.createTransport(env.SMTP_URL);
 */
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    type: 'OAuth2',
    user: args.from_email,
    serviceClient: creds.client_id,
    privateKey: creds.private_key,
  },
});

/* Wrap sendMail in promise so we can await it.
 *
 * This might not be intuitive, but spamming 200 mails async can be a little
 * chaos, and I preferred to just send one at a time and see what mail got
 * what PDF. Then I could see that everything was working, and if someone
 * complained that they had not gotten their PDF I could see which one they
 * where suppose to get, and just send it on slack or something
 */
async function wrapedSendMail(mailOptions: nodemailer.SendMailOptions) {
  return new Promise((resolve, _) => {
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log('error is ', error);
        resolve(false);
      } else {
        console.log('Email sent: \t', info.response);
        console.log('Envelope: \t', info.envelope);
        console.log('Accepted: \t', info.accepted);
        resolve(true);
      }
    });
  });
}

/* Resolve paths to pdfs.
 *
 * The code expects to find one folder that has a bunch of PFDs.
 */
const pdfs = fs.readdirSync(args.pdfs).sort(collator.compare);

//Creates a list with all the attendees emails.
const emails = attendees.Attendees.map((e) => e.email);

if (emails.length > pdfs.length)
  throw new Error('There are more emails then pdfs');

// Zip mails and path to PDF together into target objects
const targets = emails.map((e: string, i: number) => ({
  email: e.trim(),
  path: pdfs[i],
}));

/* Create a simple prompt that displays all targets so one
 * can look over to see if everything looks good before going forward
 */
console.log('\n=============================================');
console.log('Finished parsing mails and pdfs');
console.log('=============================================');
console.log('Assigned pdfs as follows', targets);
prompt.start();
prompt.get(['continue'], function (_, result) {
  if (result.continue == 'yes' || result.continue == 'Y') {
    send();
  }
});

//Message for people that does not have support for html formatting.
const messagePlainText =
  'Heisann! Vedlagt ligger ditt foodora-gavekort på 100kr. Dersom det skulle' +
  'oppstå noen provlemer så kan du ta kontakt med bedriftskomiteen på' +
  'bedkom@online.ntnu.no så skal vi bistå så godt vi kan!';

//Message for people that has support for html formatting.
const messageHtml =
  '<p>Heisann!</p>' +
  '<p>Vedlagt ligger ditt foodora-gavekort på 100kr. ' +
  'Dersom det skulle oppstå noen problemer så kan du ta kontakt med bedriftskomiteen ' +
  'på bedkom@online.ntnu.no så skal vi bistå så godt vi kan!</p>';

// Send mail to each target while waiting for each send to complete
async function send() {
  for (let i = 0; i < targets.length; i++) {
    const target = targets[i];
    console.log('=============================================');
    console.log('Next target: \t', target.email);
    if (!target.path) {
      console.warn('No PDF attached to this email');
    } else {
      console.log('Using file: \t', target.path);
    }
    const filePath = path.join(args.pdfs, target.path);

    // Set mail options using args to specify what gets sent
    const mailOptions = {
      to: target.email,
      from: `${args.from} <${args.from_email}>`,
      replyTo: 'bedkom@online.ntnu.no',
      subject: `${args.occation} foodora gavekort`,
      text: messagePlainText,
      html: messageHtml,
      attachments: [
        {
          filename: `${args.from}_${args.occation}.pdf`,
          contentType: 'application/pdf',
          path: filePath,
        },
      ],
    };

    await wrapedSendMail(mailOptions);
  }
}
