// Cloudflare Pages Function: POST /api/coach
// Neemt het meest recente stukje transcript en geeft live coaching-advies terug.
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
  if (transcript.length > 6000) {
    return jsonResponse({ error: 'Transcript te lang.' }, 400);
  }

  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return jsonResponse({ error: 'Server mist ANTHROPIC_API_KEY.' }, 500);
  }

  const model = env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250929';

  const tool = {
    name: 'coaching_update',
    description:
      'Geef live coaching-advies tijdens een lopend verkoop- of sollicitatiegesprek, gebaseerd op het transcript tot nu toe.',
    input_schema: {
      type: 'object',
      properties: {
        volgende_vraag: {
          type: 'string',
          description:
            'De beste volgende vraag of zin die de gebruiker nu kan stellen, in het Nederlands, kort en direct bruikbaar.'
        },
        bezwaar_tip: {
          type: 'string',
          description:
            'Als de gesprekspartner net een bezwaar of twijfel uitte: een korte tip om dat te pareren. Laat leeg ("") als er geen bezwaar is.'
        },
        koopsignaal: {
          type: 'string',
          enum: ['geen', 'zwak', 'sterk'],
          description: 'Sterkte van het meest recente koop- of interesse-signaal in het gesprek.'
        },
        score: {
          type: 'object',
          properties: {
            luisteren: { type: 'integer', minimum: 0, maximum: 10 },
            structuur: { type: 'integer', minimum: 0, maximum: 10 },
            tempo: { type: 'integer', minimum: 0, maximum: 10 }
          },
          required: ['luisteren', 'structuur', 'tempo']
        }
      },
      required: ['volgende_vraag', 'koopsignaal', 'score']
    }
  };

  const system = `Je bent een ervaren Nederlandstalige sales- en gesprekscoach die live meeluistert met verkoop- en sollicitatiegesprekken.
Je krijgt telkens het meest recente stuk transcript van een lopend gesprek (automatisch getranscribeerd, dus met mogelijk kleine fouten of afgebroken zinnen).
Geef beknopte, direct bruikbare coaching in vloeiend, natuurlijk Nederlands — geen Engelse termen tenzij het vakjargon is dat Nederlandse verkopers echt gebruiken.
Wees concreet en kort: de gebruiker leest dit terwijl het gesprek doorgaat.
Roep altijd de tool "coaching_update" aan met je advies.`;

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
        max_tokens: 500,
        system,
        tools: [tool],
        tool_choice: { type: 'tool', name: 'coaching_update' },
        messages: [
          {
            role: 'user',
            content: `Transcript tot nu toe:\n\n${transcript}`
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
