// hooks/useGoogleAuth.ts
import { useState, useEffect, useCallback } from 'react';
import { AppData } from '../App';

export enum AuthStatus {
    LOADING = 'LOADING',
    AUTHENTICATED = 'AUTHENTICATED',
    UNAUTHENTICATED = 'UNAUTHENTICATED',
    ERROR = 'ERROR'
}

const API_KEY = 'AIzaSyDiSMwt9hwZrE0Jvt_OGDnxyxWdADupvj8';
const CLIENT_ID: string = '998744714177-bvvgdulte02cjkg5ijtm19udthuvcjm8.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/drive.appdata';
const FILENAME = 'montanha_bilhar_data.json';

export const useGoogleAuth = () => {
    const [gapi, setGapi] = useState<any>(null);
    const [tokenClient, setTokenClient] = useState<any>(null);
    const [authStatus, setAuthStatus] = useState<AuthStatus>(AuthStatus.LOADING);
    const [userProfile, setUserProfile] = useState<any>(null);

    const isConfigured = !!(CLIENT_ID && API_KEY && !CLIENT_ID.startsWith('YOUR'));

    // Load GAPI and GIS scripts once on mount
    useEffect(() => {
        const loadScripts = async () => {
            const gapiScript = document.createElement('script');
            gapiScript.src = 'https://apis.google.com/js/api.js';
            gapiScript.async = true;
            gapiScript.defer = true;
            document.body.appendChild(gapiScript);
            
            const gisScript = document.createElement('script');
            gisScript.src = 'https://accounts.google.com/gsi/client';
            gisScript.async = true;
            gisScript.defer = true;
            document.body.appendChild(gisScript);

            await Promise.all([
                new Promise(resolve => { gapiScript.onload = resolve; }),
                new Promise(resolve => { gisScript.onload = resolve; })
            ]);

            (window as any).gapi.load('client', () => {
                setGapi((window as any).gapi);
            });
        };
        loadScripts().catch(console.error);
    }, []); // Empty array ensures this runs only once

    const fetchUserProfile = useCallback(async (gapiInstance: any) => {
        try {
            const profile = await gapiInstance.client.drive.about.get({ fields: 'user' });
            setUserProfile(profile.result.user);
            setAuthStatus(AuthStatus.AUTHENTICATED);
        } catch (e) {
            console.error("Error fetching user profile", e);
            setAuthStatus(AuthStatus.ERROR);
        }
    }, []);

    // Initialize clients and attempt silent sign-in once GAPI is ready
    useEffect(() => {
        if (!gapi || !isConfigured || tokenClient) {
            if (!isConfigured) setAuthStatus(AuthStatus.UNAUTHENTICATED);
            return;
        }

        let isMounted = true;
        const init = async () => {
            await gapi.client.init({
                apiKey: API_KEY,
                discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
            });

            const client = (window as any).google.accounts.oauth2.initTokenClient({
                client_id: CLIENT_ID,
                scope: SCOPES,
                callback: (tokenResponse: any) => {
                    if (!isMounted) return;
                    if (tokenResponse && tokenResponse.access_token) {
                        gapi.client.setToken(tokenResponse);
                        fetchUserProfile(gapi);
                    }
                },
                error_callback: () => {
                    if (isMounted) setAuthStatus(AuthStatus.UNAUTHENTICATED);
                }
            });

            if (isMounted) {
                setTokenClient(client);
                client.requestAccessToken({ prompt: 'none' });
                setTimeout(() => {
                    if (isMounted && authStatus === AuthStatus.LOADING) {
                        setAuthStatus(AuthStatus.UNAUTHENTICATED);
                    }
                }, 2500);
            }
        };

        init().catch(e => {
            console.error("Error initializing Google clients:", e);
            if (isMounted) setAuthStatus(AuthStatus.ERROR);
        });
        
        return () => { isMounted = false; }

    }, [gapi, isConfigured, tokenClient, fetchUserProfile, authStatus]);


    const signIn = useCallback(() => {
        if (tokenClient) {
            tokenClient.requestAccessToken({ prompt: 'consent' });
        } else {
            console.error("Sign-in called before token client was ready.");
        }
    }, [tokenClient]);

    const signOut = useCallback(() => {
        if (gapi) {
            const token = gapi.client.getToken();
            if (token) {
                (window as any).google.accounts.oauth2.revoke(token.access_token, () => {});
                gapi.client.setToken(null);
            }
        }
        setUserProfile(null);
        setAuthStatus(AuthStatus.UNAUTHENTICATED);
    }, [gapi]);

    const findFile = useCallback(async (): Promise<string | null> => {
        if (!gapi || authStatus !== AuthStatus.AUTHENTICATED) return null;
        try {
            const response = await gapi.client.drive.files.list({
                q: `name='${FILENAME}' and trashed=false`,
                spaces: 'appDataFolder',
                fields: 'files(id, name)',
            });
            const files = response.result.files;
            return files.length > 0 ? files[0].id : null;
        } catch (error) {
            console.error("Error finding file:", error);
            return null;
        }
    }, [gapi, authStatus]);

    const loadData = useCallback(async (): Promise<AppData | null> => {
        const fileId = await findFile();
        if (!fileId) return null;

        try {
            const response = await gapi.client.drive.files.get({ fileId, alt: 'media' });
            return JSON.parse(response.body);
        } catch (error) {
            console.error("Error loading file:", error);
            return null;
        }
    }, [findFile, gapi]);

    const saveData = useCallback(async (content: AppData): Promise<boolean> => {
        if (!gapi || authStatus !== AuthStatus.AUTHENTICATED) return false;

        const fileId = await findFile();
        
        const boundary = '-------314159265358979323846';
        const delimiter = `\r\n--${boundary}\r\n`;
        const close_delim = `\r\n--${boundary}--`;
        
        const metadata = { 
            name: FILENAME, 
            mimeType: 'application/json',
            ...( !fileId && { parents: ['appDataFolder'] })
        };
        
        const multipartRequestBody =
            delimiter +
            'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
            JSON.stringify(metadata) +
            delimiter +
            'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
            JSON.stringify(content) +
            close_delim;
        
        try {
            const path = fileId 
                ? `/upload/drive/v3/files/${fileId}` 
                : '/upload/drive/v3/files';
            const method = fileId ? 'PATCH' : 'POST';

            await gapi.client.request({
                path: path,
                method: method,
                params: { uploadType: 'multipart', fields: 'id' },
                headers: { 'Content-Type': `multipart/related; boundary="${boundary}"` },
                body: multipartRequestBody,
            });
            return true;
        } catch (error) {
            console.error("Error saving file:", error);
            return false;
        }
    }, [gapi, authStatus, findFile]);


    return { signIn, signOut, loadData, saveData, authStatus, userProfile, isConfigured };
};