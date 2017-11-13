# Authentication web app (app-web-auth2)

Pryv.io web pages for user registration, authentication & password reset.

These web pages are the "popup frame" that opens during the authentication process [http://api.pryv.com/reference/#authentication](http://api.pryv.com/reference/#authentication)

The App flow:

1. Frame (access.html) is open by the web-app or mobile app.
2. It proposes to login or register (register flow see bellow) 
3. Login is called by [`POST /auth/login`](https://api.pryv.com/reference-full/#login-user) => result *personal token*
4. The *personal token* is used to call [`POST /accesses/check-app`](https://api.pryv.com/reference-full/#check-app-authorization) => receive either a token if a `matchingAccess` already exists or the required modification. If there is a matching access, the process is over and the frame closes. 
5. The frame displays a list of modification from the result of the previous `check-app` call and asks the user for consent.
6. If the consent is given the process ends.

Registration:
 
1. Is a "side" frame where the use can create an account. 
1. When done the result is equivalent to a `LOGIN`

## Extra API documentation

Some fields can be validated directly during the fill-in with the following calls.

Registration

- invitationToken: `POST /access/invitationtoken/check` `{invitationtoken: '....'}` => result in `text/plain` "true" or "false"
- email check if valid and available: `POST /access/email/check` `{email: '....'}` => result in `text/plain` "true" or "false" 
- email status: `GET /{email}/check_email` return => 
	- 400 'INVALID_EMAIL'
	- 200 `{exists: true/false}` 
- username check if valid and available: `POST /access/username/check` `{username: '....'}` => result in `text/plain` "true" or "false"
- username status: `GET /{username}/check_username` return => 
	- 400 'INVALID_USERNAME'
	- 200 `{reserved: true/false}`


## Customization

*Prerequisites*: Node v8+, Yarn v0.27+

Pages need to be built (see "Build" section). The result is published into the `dist/` folder. The content of this folder is to be published on the `gh-pages`git branch.

### Build

Run `yarn setup` to install the dependencies and create the `dist/` folder to publish on gh-pages.

Run `yarn grunt` to generate the web pages to `dist/v2`. `yarn grunt watch` starts a daemon that generates the web pages upon source file saves.

### Modify

#### HTML templates

These can be found in `src/html`

#### Images

You will find the images under `assets/img`.

- `main-logo.png` is shown on top of every view.
- `page-logo.png` is the favicon displayed on the tab.
- `pryv-icon.png` is shown on the Permissions view on the right after a successful first time sign in. It represents the pryv.io platform.
- `app-icon.png` is the default image shown on the Permissions view on the left after a successful first time sign in. It represents the app that asks for permissions. In order to customize this picture for your appId, you must add it to the pryv.io platform.
- `arrow-icon.png` is used on the Permissions view.

### Test

1. Run `yarn webserver` to start a simple server hosting the web pages in `dist/`
2. Open [https://pryv.github.io/app-web-access/?pryv-reg=reg.pryv.me](https://pryv.github.io/app-web-access/?pryv-reg=reg.pryv.me) (replace `pryv.me` if you are working on another platform)
3. If needed, Customize the permissions and appId 
4. Click on `Show/hide advanced options` then select `Run on local web-auth (port 4443)`, this will force it to use the pages hosted by the local server. 
5. Click on "Request Access", this will send an [Auth request](http://api.pryv.com/reference/#auth-request) to the host that you set in the `pryv-reg` URL parameter and parse the response.
6. Click on the red "Sign in" button to launch the `access.html` page of the web app.   
7. You can find a sequence of actions to test the web pages in [/test](#test/README.md).

### Commit

Run `yarn eslint` to run the linter on `src/`.

Once you are satisfied with the result, run `yarn upload COMMIT_MESSAGE`.

Run `yarn clear` to delete the `dist/` folder, this will require to run `yarn setup` for tasks requiring `dist/`.

## Note to publish from github pages

To use these pages:

1. create a symlink in #gh-pages, `${DOMAIN}` -> `{v0,1,2}/`
2. `sw.${DOMAIN}/access/` must proxy to `pryv.github.io/app-web-auth2/${DOMAIN}/` 


## License

[Revised BSD license](https://github.com/pryv/documents/blob/master/license-bsd-revised.md)
