import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
}

const db = admin.firestore();

export default async function handler(req, res) {
  const { email } = req.query;

  if (!email) {
    return res.status(400).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invalid Link - Islamic Daily Reminder</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            transition: all 0.3s ease;
          }
          
          .card {
            background: white;
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
            text-align: center;
            max-width: 500px;
            width: 100%;
            animation: slideUp 0.6s ease-out;
          }
          
          .icon {
            font-size: 4rem;
            color: #ff6b6b;
            margin-bottom: 20px;
            animation: bounce 1s infinite alternate;
          }
          
          h1 {
            color: #2d3436;
            margin-bottom: 15px;
            font-size: 2rem;
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
          
          p {
            color: #636e72;
            line-height: 1.6;
            margin-bottom: 25px;
            font-size: 1.1rem;
          }
          
          .home-btn {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            background: linear-gradient(135deg, #2d6a4f 0%, #40916c 100%);
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 50px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            text-decoration: none;
            transition: all 0.3s ease;
            box-shadow: 0 5px 15px rgba(45, 106, 79, 0.3);
          }
          
          .home-btn:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 20px rgba(45, 106, 79, 0.4);
          }
          
          .home-btn i {
            font-size: 1.2rem;
          }
          
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes bounce {
            from {
              transform: translateY(0);
            }
            to {
              transform: translateY(-10px);
            }
          }
          
          @media (max-width: 480px) {
            .card {
              padding: 30px 20px;
            }
            
            h1 {
              font-size: 1.5rem;
            }
            
            .icon {
              font-size: 3rem;
            }
          }
        </style>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
      </head>
      <body>
        <div class="card">
          <div class="icon">
            <i class="fas fa-exclamation-circle"></i>
          </div>
          <h1>Invalid Unsubscribe Link</h1>
          <p>The unsubscribe link you used is invalid or has expired. Please check your email for the correct link or contact support.</p>
          <a href="https://islamic-daily-reminder.vercel.app" class="home-btn">
            <i class="fas fa-home"></i>
            Return to Home
          </a>
        </div>
      </body>
      </html>
    `);
  }

  try {
    const snap = await db
      .collection("subscriptions")
      .where("email", "==", email)
      .get();

    let success = false;
    if (!snap.empty) {
      const batch = db.batch();
      snap.forEach(doc => {
        batch.update(doc.ref, { 
          active: false,
          unsubscribedAt: new Date().toISOString(),
          unsubscribedVia: "email_link"
        });
      });
      await batch.commit();
      success = true;
    }

    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Unsubscribed - Islamic Daily Reminder</title>
        <meta name="description" content="You have been unsubscribed from Islamic Daily Reminder emails">
        <style>
          :root {
            --primary-color: #2d6a4f;
            --primary-light: #40916c;
            --secondary-color: #ff9e00;
            --success-color: #2e7d32;
            --error-color: #d32f2f;
            --text-primary: #2d3436;
            --text-secondary: #636e72;
            --bg-gradient: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            --card-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
            --transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          }
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: var(--bg-gradient);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            color: var(--text-primary);
            position: relative;
            overflow-x: hidden;
          }
          
          body::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: 
              radial-gradient(circle at 20% 80%, rgba(45, 106, 79, 0.05) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(64, 145, 108, 0.05) 0%, transparent 50%);
            z-index: -1;
          }
          
          .container {
            max-width: 600px;
            width: 100%;
            animation: containerAppear 0.8s ease-out;
          }
          
          .card {
            background: white;
            border-radius: 24px;
            padding: 50px 40px;
            box-shadow: var(--card-shadow);
            text-align: center;
            position: relative;
            overflow: hidden;
            transition: var(--transition);
            border: 1px solid rgba(0, 0, 0, 0.05);
          }
          
          .card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 6px;
            background: linear-gradient(90deg, var(--primary-color), var(--primary-light));
          }
          
          .success-animation {
            position: relative;
            margin-bottom: 30px;
          }
          
          .icon-wrapper {
            width: 100px;
            height: 100px;
            margin: 0 auto 25px;
            background: linear-gradient(135deg, rgba(45, 106, 79, 0.1), rgba(64, 145, 108, 0.1));
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: iconFloat 3s ease-in-out infinite;
          }
          
          .icon {
            font-size: 3.5rem;
            color: var(--primary-color);
            animation: iconPulse 2s ease-in-out infinite;
          }
          
          h1 {
            font-size: 2.5rem;
            margin-bottom: 15px;
            background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            line-height: 1.2;
          }
          
          .subtitle {
            color: var(--text-secondary);
            font-size: 1.1rem;
            margin-bottom: 30px;
            line-height: 1.6;
          }
          
          .email-display {
            background: rgba(45, 106, 79, 0.05);
            padding: 15px 20px;
            border-radius: 12px;
            margin: 25px 0;
            font-family: 'Courier New', monospace;
            font-size: 1.1rem;
            color: var(--primary-color);
            border-left: 4px solid var(--primary-color);
            word-break: break-all;
            text-align: left;
            display: flex;
            align-items: center;
            gap: 10px;
          }
          
          .email-display i {
            color: var(--primary-color);
            font-size: 1.2rem;
          }
          
          .message-box {
            background: rgba(255, 158, 0, 0.05);
            padding: 20px;
            border-radius: 16px;
            margin: 30px 0;
            border: 1px solid rgba(255, 158, 0, 0.1);
            text-align: left;
          }
          
          .message-box p {
            display: flex;
            align-items: flex-start;
            gap: 15px;
            margin-bottom: 15px;
          }
          
          .message-box i {
            color: var(--secondary-color);
            font-size: 1.3rem;
            margin-top: 3px;
            flex-shrink: 0;
          }
          
          .button-group {
            display: flex;
            gap: 15px;
            justify-content: center;
            margin-top: 35px;
            flex-wrap: wrap;
          }
          
          .btn {
            padding: 16px 32px;
            border-radius: 50px;
            font-size: 1rem;
            font-weight: 600;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 12px;
            transition: var(--transition);
            cursor: pointer;
            border: none;
          }
          
          .btn-primary {
            background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
            color: white;
            box-shadow: 0 8px 20px rgba(45, 106, 79, 0.3);
          }
          
          .btn-primary:hover {
            transform: translateY(-3px);
            box-shadow: 0 15px 30px rgba(45, 106, 79, 0.4);
          }
          
          .btn-secondary {
            background: transparent;
            color: var(--primary-color);
            border: 2px solid var(--primary-color);
          }
          
          .btn-secondary:hover {
            background: var(--primary-color);
            color: white;
          }
          
          .stats {
            display: flex;
            justify-content: space-around;
            margin: 40px 0 20px;
            padding: 25px;
            background: rgba(45, 106, 79, 0.03);
            border-radius: 16px;
            border: 1px solid rgba(45, 106, 79, 0.1);
          }
          
          .stat-item {
            text-align: center;
          }
          
          .stat-number {
            font-size: 2rem;
            font-weight: 700;
            color: var(--primary-color);
            display: block;
          }
          
          .stat-label {
            font-size: 0.9rem;
            color: var(--text-secondary);
            margin-top: 5px;
          }
          
          .footer {
            margin-top: 40px;
            padding-top: 25px;
            border-top: 1px solid rgba(0, 0, 0, 0.1);
            color: var(--text-secondary);
            font-size: 0.9rem;
          }
          
          .footer p {
            margin: 10px 0;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
          }
          
          .footer i {
            color: var(--primary-color);
          }
          
          /* Animations */
          @keyframes containerAppear {
            from {
              opacity: 0;
              transform: translateY(40px) scale(0.95);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
          
          @keyframes iconFloat {
            0%, 100% {
              transform: translateY(0);
            }
            50% {
              transform: translateY(-10px);
            }
          }
          
          @keyframes iconPulse {
            0%, 100% {
              transform: scale(1);
            }
            50% {
              transform: scale(1.1);
            }
          }
          
          @keyframes checkmarkAppear {
            0% {
              transform: scale(0);
              opacity: 0;
            }
            50% {
              transform: scale(1.2);
            }
            100% {
              transform: scale(1);
              opacity: 1;
            }
          }
          
          .confetti {
            position: fixed;
            width: 15px;
            height: 15px;
            background: var(--primary-color);
            opacity: 0;
          }
          
          /* Responsive Design */
          @media (max-width: 768px) {
            .card {
              padding: 40px 25px;
            }
            
            h1 {
              font-size: 2rem;
            }
            
            .button-group {
              flex-direction: column;
            }
            
            .btn {
              width: 100%;
              justify-content: center;
            }
            
            .stats {
              flex-direction: column;
              gap: 20px;
            }
          }
          
          @media (max-width: 480px) {
            .card {
              padding: 30px 20px;
            }
            
            h1 {
              font-size: 1.8rem;
            }
            
            .icon-wrapper {
              width: 80px;
              height: 80px;
            }
            
            .icon {
              font-size: 2.5rem;
            }
          }
        </style>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
      </head>
      <body>
        <div class="container">
          <div class="card">
            <div class="success-animation">
              <div class="icon-wrapper">
                <i class="fas ${success ? 'fa-check-circle' : 'fa-exclamation-circle'} icon"></i>
              </div>
            </div>
            
            <h1>${success ? 'Successfully Unsubscribed' : 'Already Unsubscribed'}</h1>
            
            <p class="subtitle">
              ${success 
                ? 'You have been successfully removed from the Islamic Daily Reminder mailing list. We\'re sad to see you go!' 
                : 'This email was already unsubscribed from our mailing list.'}
            </p>
            
            <div class="email-display">
              <i class="fas fa-envelope"></i>
              <span>${email}</span>
            </div>
            
            <div class="message-box">
              <p>
                <i class="fas fa-info-circle"></i>
                <span>
                  ${success 
                    ? 'You will no longer receive daily Islamic reminders, Hijri dates, and event notifications.' 
                    : 'You are not currently receiving any emails from Islamic Daily Reminder.'}
                </span>
              </p>
              <p>
                <i class="fas fa-clock"></i>
                <span>The change takes effect immediately. You can resubscribe anytime from your dashboard.</span>
              </p>
            </div>
            
            <div class="stats">
              <div class="stat-item">
                <span class="stat-number">0</span>
                <span class="stat-label">Future Emails</span>
              </div>
              <div class="stat-item">
                <span class="stat-number">∞</span>
                <span class="stat-label">Allah's Blessings</span>
              </div>
              <div class="stat-item">
                <span class="stat-number">24/7</span>
                <span class="stat-label">Faith Available</span>
              </div>
            </div>
            
            <div class="button-group">
              <a href="https://islamic-daily-reminder.vercel.app" class="btn btn-primary">
                <i class="fas fa-home"></i>
                Return to Home
              </a>
              ${success ? `
                <a href="https://islamic-daily-reminder.vercel.app/dashboard.html" class="btn btn-secondary">
                  <i class="fas fa-user-cog"></i>
                  Account Settings
                </a>
              ` : ''}
            </div>
            
            <div class="footer">
              <p>
                <i class="fas fa-heart"></i>
                <span>May Allah continue to guide you on your spiritual journey</span>
              </p>
              <p>
                <i class="fas fa-moon"></i>
                <span>© 2024 Islamic Daily Reminder. All rights reserved.</span>
              </p>
            </div>
          </div>
        </div>
        
        <script>
          // Add confetti animation for successful unsubscribe
          ${success ? `
            setTimeout(() => {
              const colors = ['#2d6a4f', '#40916c', '#52b788', '#74c69d', '#95d5b2'];
              for (let i = 0; i < 50; i++) {
                const confetti = document.createElement('div');
                confetti.className = 'confetti';
                confetti.style.left = Math.random() * 100 + 'vw';
                confetti.style.top = '-20px';
                confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                confetti.style.transform = \`rotate(\${Math.random() * 360}deg)\`;
                document.body.appendChild(confetti);
                
                const animation = confetti.animate([
                  { 
                    transform: \`translate(0, 0) rotate(0deg)\`,
                    opacity: 1 
                  },
                  { 
                    transform: \`translate(\${Math.random() * 200 - 100}px, 100vh) rotate(\${Math.random() * 720}deg)\`,
                    opacity: 0 
                  }
                ], {
                  duration: Math.random() * 3000 + 2000,
                  easing: 'cubic-bezier(0.215, 0.61, 0.355, 1)'
                });
                
                animation.onfinish = () => confetti.remove();
              }
            }, 500);
          ` : ''}
          
          // Add smooth scroll to top
          window.scrollTo({ top: 0, behavior: 'smooth' });
        </script>
      </body>
      </html>
    `);
  } catch (error) {
    console.error("Unsubscribe error:", error);
    
    res.status(500).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Error - Islamic Daily Reminder</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #ffe6e6 0%, #ffcccc 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }
          
          .error-card {
            background: white;
            border-radius: 20px;
            padding: 50px 40px;
            box-shadow: 0 20px 60px rgba(211, 47, 47, 0.2);
            text-align: center;
            max-width: 500px;
            width: 100%;
            animation: shake 0.5s ease-in-out;
            border-left: 6px solid #d32f2f;
          }
          
          .error-icon {
            font-size: 4rem;
            color: #d32f2f;
            margin-bottom: 25px;
            animation: pulse 2s infinite;
          }
          
          h1 {
            color: #d32f2f;
            margin-bottom: 15px;
            font-size: 2.2rem;
          }
          
          p {
            color: #666;
            line-height: 1.6;
            margin-bottom: 25px;
            font-size: 1.1rem;
          }
          
          .btn {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            background: linear-gradient(135deg, #d32f2f 0%, #f44336 100%);
            color: white;
            padding: 15px 30px;
            border-radius: 50px;
            text-decoration: none;
            font-weight: 600;
            transition: all 0.3s ease;
            box-shadow: 0 5px 15px rgba(211, 47, 47, 0.3);
          }
          
          .btn:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 20px rgba(211, 47, 47, 0.4);
          }
          
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-10px); }
            75% { transform: translateX(10px); }
          }
          
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
          }
        </style>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
      </head>
      <body>
        <div class="error-card">
          <div class="error-icon">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <h1>Something Went Wrong</h1>
          <p>We encountered an error while processing your unsubscribe request. Please try again later or contact support.</p>
          <a href="https://islamic-daily-reminder.vercel.app" class="btn">
            <i class="fas fa-home"></i>
            Return to Home
          </a>
        </div>
      </body>
      </html>
    `);
  }
}