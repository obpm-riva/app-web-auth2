# Test instructions

1. Execute the test instructions in [root README file](../README.md#Test).
2. Click on "helpdesk" link and check that its valid, close the helpdesk page.
3. Check that you can alternate between login, registration and password reset views by clicking on "Create an account", "Already an user? Sign in.", "Forgot password" and "Go back to Sign in." buttons. 
4. Go to registration view, click on "terms of use" link and check that its valid, close the terms page.
5. Complete the form with new test user information and click on "Create".
6. Check that you are back in the login view with the username and password fields filled with your just created test user credentials.
7. Click on "Sign in" and check that the requested permissions are shown.
8. Accept the permissions and check that the popup closes and that the "Username" and "Access Token" fields are filled once back in app-web-access.
9. Start the auth process again by clicking the red "Sign out" then "Sign in". In the popup, click on "Forgot password", enter your test username and click on "Send request".
10. Check that a confirmation message is shown and that you received the reset password email. In this email, copy the 'resetToken' url parameter at the end of the reset link.
11. Go back to reset password page (showing the confirmation message) and append the 'resetToken' parameter at the end of the current url (with a &).
12. Press enter and check the 'Set a new password' view is shown. Complete the form with your username, a new password and click on 'Save'.
13. Check that you are back in the Sign in view and that you can sign in with your new password.
