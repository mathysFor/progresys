import { TransactionalEmailsApi, SendSmtpEmail, TransactionalEmailsApiApiKeys } from '@getbrevo/brevo';

// Initialiser le client BREVO
let apiInstance = null;

function getBrevoClient() {
  if (!apiInstance) {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
      throw new Error('BREVO_API_KEY is not configured');
    }
    apiInstance = new TransactionalEmailsApi();
    apiInstance.setApiKey(TransactionalEmailsApiApiKeys.apiKey, apiKey);
  }
  return apiInstance;
}

/**
 * Génère le template HTML de l'email avec le code d'accès
 * @param {string} code - Code d'accès (format: XXX-XX-XX)
 * @param {string} companyName - Nom de l'entreprise
 * @param {string} appUrl - URL de base de l'application
 * @returns {string} HTML de l'email
 */
function generateEmailTemplate(code, companyName, appUrl) {
  const inscriptionUrl = `${appUrl}/inscription`;
  
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Votre code d'accès</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f8fafc;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #0d9488 0%, #00bcd4 100%); border-radius: 16px 16px 0 0;">
              <div style="width: 60px; height: 60px; background-color: rgba(255, 255, 255, 0.2); border-radius: 12px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                </svg>
              </div>
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 800; line-height: 1.2;">
                Bienvenue !
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #334155; font-size: 16px; line-height: 1.6;">
                Bonjour,
              </p>
              <p style="margin: 0 0 30px; color: #334155; font-size: 16px; line-height: 1.6;">
                ${companyName ? `Votre entreprise <strong>${companyName}</strong> vous a inscrit` : 'Vous avez été inscrit'} à notre plateforme de formation. Voici votre code d'accès personnel :
              </p>
              
              <!-- Code Box -->
              <div style="background: linear-gradient(135deg, #f0fdfa 0%, #e0f2fe 100%); border: 2px solid #14b8a6; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0;">
                <p style="margin: 0 0 10px; color: #0f766e; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
                  Votre code d'accès
                </p>
                <p style="margin: 0; color: #0d9488; font-size: 36px; font-weight: 800; font-family: 'Courier New', monospace; letter-spacing: 4px;">
                  ${code}
                </p>
              </div>
              
              <p style="margin: 30px 0 20px; color: #334155; font-size: 16px; line-height: 1.6;">
                Utilisez ce code pour accéder à la plateforme et commencer votre formation.
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                <tr>
                  <td align="center" style="padding: 0;">
                    <a href="${inscriptionUrl}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #0d9488 0%, #00bcd4 100%); color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 6px rgba(13, 148, 136, 0.3);">
                      Commencer mon inscription
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 30px 0 0; color: #64748b; font-size: 14px; line-height: 1.6;">
                Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :<br>
                <a href="${inscriptionUrl}" style="color: #0d9488; text-decoration: underline;">${inscriptionUrl}</a>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f8fafc; border-radius: 0 0 16px 16px; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #64748b; font-size: 12px; text-align: center; line-height: 1.6;">
                Cet email a été envoyé automatiquement. Si vous n'avez pas demandé ce code, vous pouvez ignorer cet email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Génère la version texte de l'email
 * @param {string} code - Code d'accès
 * @param {string} companyName - Nom de l'entreprise
 * @param {string} appUrl - URL de base de l'application
 * @returns {string} Version texte de l'email
 */
function generateEmailText(code, companyName, appUrl) {
  const inscriptionUrl = `${appUrl}/inscription`;
  return `
Bienvenue !

${companyName ? `Votre entreprise ${companyName} vous a inscrit` : 'Vous avez été inscrit'} à notre plateforme de formation.

Votre code d'accès personnel : ${code}

Utilisez ce code pour accéder à la plateforme et commencer votre formation.

Pour commencer votre inscription, visitez : ${inscriptionUrl}

Cet email a été envoyé automatiquement. Si vous n'avez pas demandé ce code, vous pouvez ignorer cet email.
  `.trim();
}

/**
 * Envoie un email avec le code d'accès à un apprenant
 * @param {string} email - Email du destinataire
 * @param {string} code - Code d'accès (format: XXX-XX-XX)
 * @param {string} companyName - Nom de l'entreprise (optionnel)
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function sendCompanyCodeEmail(email, code, companyName = '') {
  try {
    // Validation
    if (!email || !email.includes('@')) {
      return { success: false, error: 'Email invalide' };
    }
    
    if (!code) {
      return { success: false, error: 'Code manquant' };
    }

    const apiInstance = getBrevoClient();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const senderEmail = process.env.BREVO_SENDER_EMAIL || 'noreply@example.com';
    const senderName = process.env.BREVO_SENDER_NAME || 'Progresys';

    // Générer le contenu de l'email
    const htmlContent = generateEmailTemplate(code, companyName, appUrl);
    const textContent = generateEmailText(code, companyName, appUrl);

    // Créer l'objet d'email
    const sendSmtpEmail = new SendSmtpEmail();
    sendSmtpEmail.subject = 'Votre code d\'accès à la plateforme de formation';
    sendSmtpEmail.htmlContent = htmlContent;
    sendSmtpEmail.textContent = textContent;
    sendSmtpEmail.sender = { name: senderName, email: senderEmail };
    sendSmtpEmail.to = [{ email: email }];

    // Envoyer l'email
    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
    
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending email via BREVO:', error);
    return { 
      success: false, 
      error: error.response?.body?.message || error.message || 'Erreur lors de l\'envoi de l\'email' 
    };
  }
}

/**
 * Génère le template HTML de l'email avec les résultats du quiz
 * @param {string} participantEmail - Email du participant
 * @param {number} score - Score obtenu
 * @param {number} total - Nombre total de questions
 * @param {number} percentage - Pourcentage obtenu
 * @param {boolean} passed - Si le quiz est réussi
 * @param {number} timeSpentSeconds - Temps passé en secondes
 * @param {string|Date} completedAt - Date de complétion
 * @returns {string} HTML de l'email
 */
function generateQuizResultsEmailTemplate(participantEmail, score, total, percentage, passed, timeSpentSeconds, completedAt) {
  const statusText = passed ? 'Réussi' : 'Échoué';
  const statusColor = passed ? '#14b8a6' : '#ef4444';
  const statusBg = passed ? '#f0fdfa' : '#fef2f2';
  const statusBorder = passed ? '#14b8a6' : '#ef4444';
  
  // Formater le temps
  const minutes = Math.floor(timeSpentSeconds / 60);
  const seconds = timeSpentSeconds % 60;
  const timeFormatted = `${minutes}m ${seconds}s`;
  
  // Formater la date
  const date = completedAt ? new Date(completedAt) : new Date();
  const dateFormatted = date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Résultats du quiz</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f8fafc;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #0d9488 0%, #00bcd4 100%); border-radius: 16px 16px 0 0;">
              <div style="width: 60px; height: 60px; background-color: rgba(255, 255, 255, 0.2); border-radius: 12px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 800; line-height: 1.2;">
                Nouveau résultat de quiz
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #334155; font-size: 16px; line-height: 1.6;">
                Bonjour,
              </p>
              <p style="margin: 0 0 30px; color: #334155; font-size: 16px; line-height: 1.6;">
                Un participant vient de terminer le quiz. Voici les détails de sa participation :
              </p>
              
              <!-- Participant Info -->
              <div style="background-color: #f8fafc; border-radius: 12px; padding: 20px; margin: 30px 0;">
                <p style="margin: 0 0 8px; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
                  Participant
                </p>
                <p style="margin: 0; color: #0d9488; font-size: 18px; font-weight: 700;">
                  ${participantEmail}
                </p>
              </div>
              
              <!-- Status Badge -->
              <div style="background: ${statusBg}; border: 2px solid ${statusBorder}; border-radius: 12px; padding: 20px; text-align: center; margin: 30px 0;">
                <p style="margin: 0 0 10px; color: ${statusColor}; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
                  Statut
                </p>
                <p style="margin: 0; color: ${statusColor}; font-size: 24px; font-weight: 800;">
                  ${statusText}
                </p>
              </div>
              
              <!-- Results Grid -->
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 30px 0;">
                <!-- Score -->
                <div style="background-color: #f8fafc; border-radius: 12px; padding: 20px; text-align: center;">
                  <p style="margin: 0 0 8px; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
                    Score
                  </p>
                  <p style="margin: 0; color: #0d9488; font-size: 28px; font-weight: 800;">
                    ${score}<span style="color: #94a3b8; font-size: 18px; font-weight: 400;"> / ${total}</span>
                  </p>
                </div>
                
                <!-- Percentage -->
                <div style="background-color: #f8fafc; border-radius: 12px; padding: 20px; text-align: center;">
                  <p style="margin: 0 0 8px; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
                    Pourcentage
                  </p>
                  <p style="margin: 0; color: #0d9488; font-size: 28px; font-weight: 800;">
                    ${percentage}%
                  </p>
                </div>
              </div>
              
              <!-- Additional Info -->
              <div style="background-color: #f8fafc; border-radius: 12px; padding: 20px; margin: 30px 0;">
                <div style="margin-bottom: 16px;">
                  <p style="margin: 0 0 4px; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
                    Temps passé
                  </p>
                  <p style="margin: 0; color: #334155; font-size: 16px; font-weight: 600;">
                    ${timeFormatted}
                  </p>
                </div>
                <div>
                  <p style="margin: 0 0 4px; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
                    Date de complétion
                  </p>
                  <p style="margin: 0; color: #334155; font-size: 16px; font-weight: 600;">
                    ${dateFormatted}
                  </p>
                </div>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f8fafc; border-radius: 0 0 16px 16px; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #64748b; font-size: 12px; text-align: center; line-height: 1.6;">
                Cet email a été envoyé automatiquement suite à la complétion d'un quiz.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Génère la version texte de l'email de résultats
 * @param {string} participantEmail - Email du participant
 * @param {number} score - Score obtenu
 * @param {number} total - Nombre total de questions
 * @param {number} percentage - Pourcentage obtenu
 * @param {boolean} passed - Si le quiz est réussi
 * @param {number} timeSpentSeconds - Temps passé en secondes
 * @param {string|Date} completedAt - Date de complétion
 * @returns {string} Version texte de l'email
 */
function generateQuizResultsEmailText(participantEmail, score, total, percentage, passed, timeSpentSeconds, completedAt) {
  const statusText = passed ? 'Réussi' : 'Échoué';
  const minutes = Math.floor(timeSpentSeconds / 60);
  const seconds = timeSpentSeconds % 60;
  const timeFormatted = `${minutes}m ${seconds}s`;
  
  const date = completedAt ? new Date(completedAt) : new Date();
  const dateFormatted = date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  return `
Nouveau résultat de quiz

Bonjour,

Un participant vient de terminer le quiz. Voici les détails de sa participation :

Participant : ${participantEmail}

Statut : ${statusText}
Score : ${score} / ${total}
Pourcentage : ${percentage}%
Temps passé : ${timeFormatted}
Date de complétion : ${dateFormatted}

Cet email a été envoyé automatiquement suite à la complétion d'un quiz.
  `.trim();
}

/**
 * Envoie un email avec les résultats du quiz à l'administrateur
 * @param {string} participantEmail - Email du participant
 * @param {number} score - Score obtenu
 * @param {number} total - Nombre total de questions
 * @param {number} percentage - Pourcentage obtenu
 * @param {boolean} passed - Si le quiz est réussi
 * @param {number} timeSpentSeconds - Temps passé en secondes
 * @param {string|Date} completedAt - Date de complétion
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
export async function sendQuizResultsEmail(participantEmail, score, total, percentage, passed, timeSpentSeconds, completedAt) {
  try {
    // Validation
    if (!participantEmail || !participantEmail.includes('@')) {
      return { success: false, error: 'Email du participant invalide' };
    }

    const apiInstance = getBrevoClient();
    const senderEmail = process.env.BREVO_SENDER_EMAIL || 'noreply@example.com';
    const senderName = process.env.BREVO_SENDER_NAME || 'Progresys';
    const adminEmail = 'reynieralexandra.vif@gmail.com'; // Email de l'administrateur

    // Générer le contenu de l'email
    const htmlContent = generateQuizResultsEmailTemplate(participantEmail, score, total, percentage, passed, timeSpentSeconds, completedAt);
    const textContent = generateQuizResultsEmailText(participantEmail, score, total, percentage, passed, timeSpentSeconds, completedAt);

    // Créer l'objet d'email
    const sendSmtpEmail = new SendSmtpEmail();
    sendSmtpEmail.subject = `Résultat du quiz - ${participantEmail} - ${passed ? 'Réussi' : 'Échoué'}`;
    sendSmtpEmail.htmlContent = htmlContent;
    sendSmtpEmail.textContent = textContent;
    sendSmtpEmail.sender = { name: senderName, email: senderEmail };
    sendSmtpEmail.to = [{ email: adminEmail }];

    // Envoyer l'email
    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
    
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending quiz results email via BREVO:', error);
    return { 
      success: false, 
      error: error.response?.body?.message || error.message || 'Erreur lors de l\'envoi de l\'email' 
    };
  }
}

