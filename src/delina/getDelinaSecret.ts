async function getOAuthToken(tenant: string, username: string, password: string) {
  const url = `https://${tenant}/oauth2/token`;
  const params = new URLSearchParams();
  params.append('grant_type', 'password');
  params.append('username', username);
  params.append('password', password);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const responseText = await response.text();
    let data;

    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.log('\n⚠ Response is not valid JSON');
      console.log('Raw response:', responseText.substring(0, 500));
      return null;
    }

    if (response.ok) {
      return data.access_token;
    } else {
      console.log('\n✗ Token request failed');
      console.log('Error:', data.error || 'Unknown');
      console.log('Description:', data.error_description || 'Not provided');
      return null;
    }
  } catch (error: any) {
    console.error('\n=== EXCEPTION ===');
    console.error(error.message);
    return null;
  }
}

async function getSecret(accessToken: string, tenant: string, secretId: number) {
  const url = `https://${tenant}/api/v2/secrets/${secretId}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const responseText = await response.text();
    let data;

    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.log('\n⚠ Response is not valid JSON');
      console.log('Raw response:', responseText.substring(0, 500));
      return null;
    }

    if (response.ok) {
      return data;
    } else {
      console.log('\n✗ Secret request failed');
      if (data.message) {
        console.log('Message:', data.message);
      }
      return null;
    }
  } catch (error: any) {
    console.error('\n=== EXCEPTION ===');
    console.error(error.message);
    return null;
  }
}

export async function getDelineaSecret(tenant: string, username: string, password: string, secretId: number) {
  const accessToken = await getOAuthToken(tenant, username, password);

  if (!accessToken) {
    console.error('\n❌ Failed to get access token. Exiting.');
    return null;
  }

  const secret = await getSecret(accessToken, tenant, secretId);

  if (!secret) {
    console.error('\n❌ Failed to retrieve secret.');
    return null;
  }

  return secret;
}
