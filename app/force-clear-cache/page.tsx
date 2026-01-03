'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ForceClearCachePage() {
  const [cleared, setCleared] = useState(false);
  const [diagnostics, setDiagnostics] = useState<any>(null);

  useEffect(() => {
    // Fetch server diagnostics
    fetch('/api/clear-browser-cache', { method: 'POST' })
      .then(res => res.json())
      .then(data => setDiagnostics(data))
      .catch(err => console.error('Failed to fetch diagnostics:', err));
  }, []);

  const forceClearEverything = () => {
    try {
      // Clear localStorage
      const localStorageKeys = Object.keys(localStorage);
      localStorage.clear();
      console.log('Cleared localStorage keys:', localStorageKeys);

      // Clear sessionStorage
      const sessionStorageKeys = Object.keys(sessionStorage);
      sessionStorage.clear();
      console.log('Cleared sessionStorage keys:', sessionStorageKeys);

      // Clear cookies
      document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
      });
      console.log('Cleared cookies');

      // Clear any IndexedDB
      if ('indexedDB' in window) {
        indexedDB.databases?.().then(databases => {
          databases.forEach(db => {
            if (db.name) {
              indexedDB.deleteDatabase(db.name);
              console.log('Cleared IndexedDB:', db.name);
            }
          });
        });
      }

      // Clear service worker cache
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
          registrations.forEach(registration => {
            registration.unregister();
            console.log('Unregistered service worker');
          });
        });
      }

      // Clear cache API
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => {
            caches.delete(name);
            console.log('Cleared cache:', name);
          });
        });
      }

      setCleared(true);
      
      // Force reload after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error) {
      console.error('Error clearing cache:', error);
      alert('Error clearing cache: ' + error);
    }
  };

  const checkCurrentValues = () => {
    const currentEnv = {
      userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID,
      clientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
      region: process.env.NEXT_PUBLIC_AWS_REGION,
      apiUrl: process.env.NEXT_PUBLIC_API_URL,
    };

    const storedTokens = localStorage.getItem('cognito_tokens');
    
    console.log('Current environment variables:', currentEnv);
    console.log('Stored Cognito tokens:', storedTokens);
    
    alert(`Current User Pool ID: ${currentEnv.userPoolId}\nStored tokens: ${storedTokens ? 'Found' : 'None'}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-red-600">
              🚨 Force Clear Browser Cache
            </CardTitle>
            <CardDescription>
              This page will completely clear all browser data to resolve the User Pool ID mismatch
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Current Status */}
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h3 className="font-semibold text-yellow-800 mb-2">🔍 Current Issue</h3>
                <p className="text-yellow-700">
                  Error: <code>User pool us-east-2_taARRQ6vu does not exist</code>
                </p>
                <p className="text-yellow-700 mt-1">
                  Expected: <code>us-east-2_t5UUpOmPL</code>
                </p>
              </div>

              {/* Server Diagnostics */}
              {diagnostics && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2">🖥️ Server Environment (Correct)</h3>
                  <div className="text-sm text-blue-700 space-y-1">
                    <p><strong>User Pool ID:</strong> {diagnostics.serverEnvironment.userPoolId}</p>
                    <p><strong>Client ID:</strong> {diagnostics.serverEnvironment.clientId}</p>
                    <p><strong>Region:</strong> {diagnostics.serverEnvironment.region}</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 flex-wrap">
                <Button 
                  onClick={checkCurrentValues}
                  variant="outline"
                  className="bg-blue-50 hover:bg-blue-100"
                >
                  Check Current Values
                </Button>
                
                <Button 
                  onClick={forceClearEverything}
                  className="bg-red-600 hover:bg-red-700 text-white"
                  disabled={cleared}
                >
                  {cleared ? 'Clearing... Will Reload' : 'Force Clear Everything'}
                </Button>
              </div>

              {cleared && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="font-semibold text-green-800">✅ Cache Cleared Successfully</h3>
                  <p className="text-green-700">Page will reload automatically...</p>
                </div>
              )}

              {/* Manual Instructions */}
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-3">📋 Manual Steps (If Automatic Clear Fails)</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                  <li><strong>Open Developer Tools:</strong> Press F12</li>
                  <li><strong>Go to Application Tab:</strong> Find "Storage" section</li>
                  <li><strong>Clear Site Data:</strong> Click "Clear site data" button</li>
                  <li><strong>Or run in Console:</strong></li>
                </ol>
                <div className="mt-2 p-2 bg-gray-100 rounded text-xs font-mono">
                  localStorage.clear();<br/>
                  sessionStorage.clear();<br/>
                  location.reload(true);
                </div>
              </div>

              {/* Browser-Specific Instructions */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                  <h4 className="font-semibold text-blue-800">Chrome/Edge</h4>
                  <p className="text-xs text-blue-700 mt-1">
                    Settings → Privacy → Clear browsing data → All time → Everything
                  </p>
                </div>
                <div className="p-3 bg-orange-50 border border-orange-200 rounded">
                  <h4 className="font-semibold text-orange-800">Firefox</h4>
                  <p className="text-xs text-orange-700 mt-1">
                    Settings → Privacy → Clear Data → Everything
                  </p>
                </div>
                <div className="p-3 bg-gray-50 border border-gray-200 rounded">
                  <h4 className="font-semibold text-gray-800">Safari</h4>
                  <p className="text-xs text-gray-700 mt-1">
                    Develop → Empty Caches, then clear website data
                  </p>
                </div>
              </div>

              {/* Final Steps */}
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">🎯 After Clearing Cache</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm text-green-700">
                  <li>Close ALL browser windows</li>
                  <li>Restart your browser completely</li>
                  <li>Visit: <a href="/test-cognito" className="underline">http://localhost:3000/test-cognito</a></li>
                  <li>Run the automated tests</li>
                  <li>Verify no more "us-east-2_taARRQ6vu" errors</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}