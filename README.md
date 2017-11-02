# Authentication web app (app-web-auth2)

Pryv.io web pages for user registration, authentication & password reset.

## Usage

To use these pages:
 
1. create a symlink in #gh-pages, `${DOMAIN}` -> `{v0,1,2}/`
2. `sw.${DOMAIN}/access/` must proxy to `pryv.github.io/app-web-auth2/${DOMAIN}/` 

## Contribute

*Prerequisites*: Node v8+, Yarn v0.27+

### Build

Run `yarn setup` to install the dependencies and create the `dist/` folder to publish on gh-pages.

Run `yarn grunt` to generate the web pages to `dist/v2`.

### Test

1. Run `yarn webserver` to start a simple server hosting the web pages in `dist/`
2. Open [https://pryv.github.io/app-web-access/?pryv-reg=reg.obpm-dev.io](https://pryv.github.io/app-web-access/?pryv-reg=reg.obpm-dev.io) (replace `obpm-dev.io` if you are working on another platform)
3. If needed, Customize the permissions and appId 
4. Click on `Show/hide advanced options` then select `Run on local web-auth (port 4443)`, this will force it to use the pages hosted by the local server. 
5. Click on "Request Access", this will send an [Auth request](http://api.pryv.com/reference/#auth-request) to the host that you set in the `pryv-reg` URL parameter and parse the response.
5. Click on the red "Sign in" button to launch the `access.html` page of the web app. 

### Commit

Once you are happy with the result, run `yarn upload COMMIT_MESSAGE`.

Run `yarn clear` to delete the `dist/` folder, this will require to run `yarn setup` for tasks requiring `dist/`.

## License

[Revised BSD license](https://github.com/pryv/documents/blob/master/license-bsd-revised.md)
