// Cloudflare Pages Function: POST /api/summary
// Neemt het volledige transcript van een afgerond gesprek en genereert een verslag.
// Vereist env var ANTHROPIC_API_KEY (Cloudflare Pages > Settings > Environment variables > Secret).

export async function onRequestPost({ request, env }) {
  let payload;
  try {
    payload = await request.json();
  } catch (e) {
    return jsonResponse({ error: 'Ongeldige aanvraag.' }, 400);
  }

  const transcript = typeof payload?.transcript === 'string' ? payload.transcript.trim() : '';
  if (!transcript) {
    return jsonResponse({ error: 'Geen transcript ontvangen.' }, 400);
  }
  if (transcript.length > 20000) {
    return jsonResponse({ error: 'Transcript te lang.' }, 400);
  }

  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return jsonResponse({ error: 'Server mist ANTHROPIC_API_KEY.' }, 500);
  }

  const model = env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250929';

  const tool = {
    name: 'gesprek_rapport',
    description: 'Genereer een verslag van een afgerond verkoop- of sollicitatiegesprek.',
    input_schema: {
      type: 'object',
      properties: {
        samenvatting: {
          type: 'string',
          description: 'Korte samenvatting van het gesprek (3-5 zinnen), in het Nederlands.'
        },
        volgende_stappen: {
          type: 'array',
          items: { type: 'string' },
          description: 'Lijst van concrete vervolgacties, elk als korte zin.'
        },
        crm_notities: {
          type: 'string',
          description:
            'Beknopte, CRM-klare notitie: context, behoeften/pijnpunten van de gesprekspartner, geuite bezwaren, en gespreksuitkomst.'
        },
        follow_up_email: {
          type: 'object',
          properties: {
            onderwerp: { type: 'string' },
            tekst: { type: 'string', description: 'Volledige e-mailtekst in het Nederlands, klaar om te versturen.' }
          },
          required: ['onderwerp', 'tekst']
        }
      },
      required: ['samenvatting', 'volgende_stappen', 'crm_notities', 'follow_up_email']
    }
  };

  const system = `Je bent een ervaren Nederlandstalige sales-ondersteuner die na afloop van een verkoop- of sollicitatiegesprek een verslag opstelt.
Je krijgt het volledige transcript (automatisch getranscribeerd, dus met mogelijk kleine fouten).
Schrijf professioneel, bondig en in vloeiend Nederlands.
Roep altijd de tool "gesprek_rapport" aan met je verslag.`;

  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model,
        max_tokens: 1200,
        system,
        tools: [tool],
        tool_choice: { type: 'tool', name: 'gesprek_rapport' },
        messages: [
          {
            role: 'user',
            content: `Volledig transcript van het gesprek:\n\n${transcript}`
          }
        ]
      })
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      console.error('Anthropic API error', anthropicRes.status, errText);
      return jsonResponse({ error: 'AI-service tijdelijk niet beschikbaar.' }, 502);
    }

    const data = await anthropicRes.json();
    const toolUse = (data.content || []).find((block) => block.type === 'tool_use');
    if (!toolUse) {
      return jsonResponse({ error: 'Onverwacht antwoord van AI-service.' }, 502);
    }

    return jsonResponse(toolUse.input, 200);
  } catch (err) {
    console.error(err);
    return jsonResponse({ error: 'Onverwachte serverfout.' }, 500);
  }
}

function jsonResponse(obj, status) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json' }
  });
}
