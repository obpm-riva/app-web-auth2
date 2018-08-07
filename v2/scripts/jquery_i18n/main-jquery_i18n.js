jQuery(document).ready(function() {
      var update_texts = function() {
            $('body').i18n();
			$('#loginUsernameOrEmail').attr('placeholder',$.i18n('your_email'));
			$('#loginPassword').attr('placeholder',$.i18n('password'));
			
			$('#registerPassword1').attr('placeholder',$.i18n('password'));
			$('#registerPassword2').attr('placeholder',$.i18n('Confirm_pass'));
			$('#email_address').attr('placeholder',$.i18n('email_address'));
			$('#registerSubmitBtn').attr('value',$.i18n('create'));
			
			$('#passwResetEmail').attr('placeholder',$.i18n('id_or_mail'));
			$('#passwResetSubmitBtn').attr('value',$.i18n('send_request'));
			

        };
		
		
		function getURLParameter(name) {
		  return decodeURIComponent((new RegExp(name + '=' + '(.+?)(&|$)')
			.exec(location.search)||['',''])[1]);
		}
 
        $.i18n().load({
			'en': {
			  'login_to_account': 'Login to your account',
			  'login_button': 'LOGIN',
			  'no_account_yet': 'I don’t have an account yet',
			  'forgot_pass': 'Forgot your password?',
			  'your_email': 'Your email address',
			  'password': 'Password',
			  
			  'user_id': 'User ID',
			  'Confirm_pass': 'Confirm password',
			  'email_address': 'E-mail adress',
			  'email_address_required': 'Email address is required for password recovery',
			  'optional': 'optional',
			  'Already_have_account': 'Already have an account? Sign in.',
			  'create': 'CREATE',
			  
			  'request_pass_reset': 'Request password reset',
			  'id_or_mail': 'UserID or Email',
			  'send_request': 'Send request',
			  'go_back': 'Go back to Sign In',
			  'reset_sent': 'We\'ve sent password reset instructions to your e-mail address',
			  'look_in_junk': 'If you don\'t receive a message within a few minutes, you may want to have a look in your junk mail.',
			  
			  'unknown_username': 'Unknown username',
			  'passwords_not_match': 'Password does not match the confirm password.',
			  'username_unknown': 'Username unknown: ', 
			  'unknown_email': 'Unknown e-mail',
			  'invalid_email': 'Invalid email adress',
			  
			  'new_pass': 'New password',
			  'confirm_new_pass': 'Confirm new password',
			  
			  'set_new_pass': 'Set a new password',
			  'host_my_data': 'Host my data in',
			  'i_agree': 'By tapping "Agree", I agree the terms and conditions',
			  'agree': 'AGREE',

			  'terms': 'TERMS & CONDITIONS'

			  
			},
			'de': {
			  'login_to_account': 'Einloggen',
			  'login_button': 'EINLOGGEN',
			  'no_account_yet': 'Ich habe noch keinen Konto',
			  'forgot_pass': 'Passwort vergessen?',
			  'your_email': 'Ihre Email-Adresse',
			  'password': 'Passwort',
			  
			  'user_id': 'Benutzer ID',
			  'Confirm_pass': 'Passwort bestätigen',
			  'email_address': 'Email Adresse',
			  'email_address_required': 'Die Email-Adresse ist für die Passwortwiederherstellung erforderlich',
			  'optional': 'optional',
			  'Already_have_account': 'Bereits registriert? Einloggen.',
			  'create': 'ERSTELLEN',
			  
			  'request_pass_reset': 'Passwort zurücksetzen',
			  'id_or_mail': 'Benutzer ID oder Email',
			  'send_request': 'Anfrage senden',
			  'go_back': 'Zurück zur Anmeldung',
			  'reset_sent': 'Wir haben Anweisungen zum Zurücksetzen des Passworts an Ihre Email-Adresse gesendet',
			  'look_in_junk': 'Wenn Sie innerhalb weniger Minuten keine Nachricht erhalten, sollten Sie in Ihrem Spam Ordner nachsehen.',
			  
			  'unknown_username': 'Benutzername unbekannt',
			  'passwords_not_match': 'Das Passwort stimmt nicht mit dem Bestätigungspasswort überein.',
			  'username_unknown': 'Benutzername unbekannt: ', 
			  'unknown_email': 'Email unbekannt',
			  'invalid_email': 'Email ungültig',
			  
			  'new_pass': 'Neues Passwort',
			  'confirm_new_pass': 'Passwort bestätigen',
			  
			  'set_new_pass': 'Neues Passwort eingeben',
			  'host_my_data': 'Host my data in!!!',
			  'i_agree': 'By tapping "Agree", I agree the terms and conditions!!!',
			  'agree': 'ANNEHMEN',

			  'terms': 'AGB'
			},
			'fr': {
			  'login_to_account': 'Connectez-vous à votre compte',
			  'login_button': 'CONNECTER',
			  'no_account_yet': 'Je n\'ai pas encore de compte',
			  'forgot_pass': 'Mot de passe oublié?',
			  'your_email': 'Votre adresse email',
			  'password': 'Mot de passe',
			  
			  'user_id': 'Utilisateur ID',
			  'Confirm_pass': 'Confirmer mot de passe',
			  'email_address': 'Adresse email',
			  'email_address_required': 'L\'adresse email est requise pour la récupération du mot de passe',
			  'optional': 'optionnel',
			  'Already_have_account': 'Vous avez déjà un compte? Connectez-vous.',
			  'create': 'CRÉER',
			  
			  'request_pass_reset': 'Réinitialiser le mot de passe',
			  'id_or_mail': 'ID Utilisateur ou email',
			  'send_request': 'Envoyer la demande',
			  'go_back': 'Revenez à la connexion',
			  'reset_sent': 'Nous avons envoyé des instructions de réinitialisation de mot de passe à votre adresse e-mail',
			  'look_in_junk': 'Si vous ne recevez pas de message dans les minutes qui suivent, vous pouvez regarder dans votre fichier spam',
			  
			  'unknown_username': 'Utilisateur inconnu',
			  'passwords_not_match': 'Le mot de passe ne correspond pas au mot de passe de confirmation.',
			  'username_unknown': 'Utilisateur inconnu: ', 
			  'unknown_email': 'Email inconnu',
			  'invalid_email': 'Adresse email invalide',
			  
			  'new_pass': 'Nouveau mot de passe',
			  'confirm_new_pass': 'Confirmer mot de passe',
			  
			  'set_new_pass': 'Définez un nouveau mot de passe',
			  'host_my_data': 'Host my data in!!!',
			  'i_agree': 'By tapping "Agree", I agree the terms and conditions!!!',
			  'agree': 'ACCEPTER',

			  'terms': 'TERMES ET CONDITIONS'
			}
		});
		
		
 
		var lang = getURLParameter('lang');
		switch (lang)
		{
		   case "fr":
				//alert('fr');
				$.i18n().locale = 'fr';
				break;
		   case "de":
				//alert('de');
				$.i18n().locale = 'de';
				break;

		   default: 
			   //alert('Default case');
			   $.i18n().locale = 'en';
		}

        update_texts();
    });
	
