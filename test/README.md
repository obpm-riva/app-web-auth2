# Test instructions

1. Execute the test instructions in [root README file](../README.md#Test).

### Navigation and external links

2. Click on "helpdesk" link and check that its valid, close the helpdesk page.
3. Check that you can alternate between login, registration and password reset views by clicking on "Create an account", "Already an user? Sign in.", "Forgot password" and "Go back to Sign in." buttons. 
4. Go to registration view, click on "terms of use" link and check that its valid, close the terms page.

### User creation, sign in & permissions

5. Complete the form with new test user information and click on "Create".
6. You should be on the Permissions view, check that the requested permissions are shown.
7. Accept the permissions and check that the popup closes and that the "Username" and "Access Token" fields are filled once back in app-web-access.

### Password reset

8. Start the auth process again by clicking the red button, accept to sign out then click on it again when it shows "Sign in". In the popup, click on "Forgot password", enter your test username and click on "Send request".
9. Check that a confirmation message is shown and that you received the reset password email. In this email, copy the 'resetToken' url parameter at the end of the reset link.
10. Go back to reset password page (showing the confirmation message) and append the 'resetToken' parameter at the end of the current url (with a &).
11. Press enter and check the 'Set a new password' view is shown. Complete the form with your username, a new password and click on 'Save'.
12. Check that you are back in the Sign in view and that you can sign in with your new password.

### Error display

13. Start the auth process again by clicking the red button, accept to sign out then click on it again when it shows "Sign in". 
14. Enter an existing username with a wrong password and verify that an error message is displayed.
15. Enter a non existing username with a bogus password and verify that a correct error message is displayed.
16. Click on "Create an account" and fill the credentials with an already used email address, click on "Create" and verify that the appropriate error message is shown.
17. Change to an unused e-mail address, but choose an already used username, click on "Create" and verify that the appropriate error message is shown.
18. Go back to the "Sign in" page, then click on "Forgot password", enter an unexisting username and verify that the appropriate error message is shown.

### Standalone pages

19. In a new window, open [https://l.rec.la:4443/obpm-dev.io/register.html](https://l.rec.la:4443/obpm-dev.io/register.html) (if necessary, change the domain from `obpm-dev.io` to the one you are working on), enter valid credentials and click on "Create". This should lead you to the URL defined in the `api` property of [https://reg.obpm-dev.io/service/infos](https://reg.obpm-dev.io/service/infos) (same here about the domain).
20. In a new window, open [https://l.rec.la:4443/obpm-dev.io/signinhub.html](https://l.rec.la:4443/obpm-dev.io/signinhub.html), enter a valid username and verify that it leads you to [https://{username}.obpm-dev.io/#/SignIn](https://{username}.obpm-dev.io/#/SignIn).
21. In a new window, open [https://l.rec.la:4443/obpm-dev.io/reset-password.html](https://l.rec.la:4443/obpm-dev.io/reset-password.html), enter a username and verify that you received an email.

