require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Helper to group emails by subject context
function groupEmails(emails) {
    const groups = {};
    emails.forEach(email => {
        // Clean subject: remove Re:, Fwd:, [Tag], etc.
        let cleanSubject = email.subject
            .replace(/^(Re|Fwd|RE|FWD|rE|fWd):\s*/i, '')
            .replace(/\[.*?\]\s*/g, '')
            .trim();
        
        if (!groups[cleanSubject]) {
            groups[cleanSubject] = {
                context: cleanSubject,
                emails: [],
                count: 0
            };
        }
        groups[cleanSubject].emails.push(email);
        groups[cleanSubject].count++;
    });
    
    return Object.values(groups).sort((a, b) => b.count - a.count);
}

app.post('/api/gmail/scrape', async (req, res) => {
    const { token, searchWord } = req.body;

    if (!token) {
        return res.status(400).json({ error: 'Auth token is required' });
    }

    try {
        const auth = new google.auth.OAuth2();
        auth.setCredentials({ access_token: token });

        const gmail = google.gmail({ version: 'v1', auth });
        
        // Build search query if searchWord is provided
        const q = searchWord ? `"${searchWord}"` : '';

        const response = await gmail.users.messages.list({
            userId: 'me',
            maxResults: 100,
            q: q
        });

        const messages = response.data.messages || [];
        const detailedMessages = await Promise.all(
            messages.map(async (msg) => {
                const details = await gmail.users.messages.get({
                    userId: 'me',
                    id: msg.id
                });
                
                const headers = details.data.payload.headers;
                const subject = headers.find(h => h.name === 'Subject')?.value || '(No Subject)';
                const from = headers.find(h => h.name === 'From')?.value || '(Unknown)';
                const date = headers.find(h => h.name === 'Date')?.value || '';
                const snippet = details.data.snippet;

                return {
                    id: msg.id,
                    threadId: msg.threadId,
                    subject,
                    from,
                    date,
                    snippet
                };
            })
        );

        const grouped = groupEmails(detailedMessages);

        res.json({
            success: true,
            totalMessages: detailedMessages.length,
            groups: grouped
        });
    } catch (error) {
        console.error('Gmail Scrape Error:', error);
        res.status(500).json({ error: 'Failed to scrape Gmail. ' + error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Express server running on http://localhost:${PORT}`);
});

