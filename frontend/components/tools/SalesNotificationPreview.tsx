import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, Trash2 } from 'lucide-react';

interface PreviewProps {
  demo: boolean;
  requireConsent: boolean;
  position: 'left' | 'right';
  displayMs: number;
  minInterval: number;
  maxInterval: number;
  maxShows: number;
  respectSessionClose: boolean;
  themeBg: string;
  themeText: string;
  productName: string;
  productImg: string;
  messages: string;
  agoMin: number;
  agoMax: number;
  names: string;
  cities: string;
}

interface Toast {
  id: number;
  name: string;
  city: string;
  message: string;
  ago: number;
  opacity: number;
  translateY: number;
}

export default function SalesNotificationPreview(props: PreviewProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showCount, setShowCount] = useState(0);
  const [counterAnimate, setCounterAnimate] = useState(false);
  const [isClosed, setIsClosed] = useState(false);
  const [hasConsent, setHasConsent] = useState(!props.requireConsent);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const toastIdRef = useRef(0);

  const messagesArray = props.messages.split('\n').filter(m => m.trim());
  const namesArray = props.names.split('\n').filter(n => n.trim());
  const citiesArray = props.cities.split('\n').filter(c => c.trim());

  const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
  const randomBetween = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

  const showNotification = () => {
    if (isClosed && props.respectSessionClose) return;
    if (!hasConsent) return;
    if (!props.demo && showCount >= props.maxShows) return;

    const id = toastIdRef.current++;
    const name = pick(namesArray);
    const city = pick(citiesArray);
    const message = pick(messagesArray);
    const ago = randomBetween(props.agoMin, props.agoMax);

    const newToast: Toast = { id, name, city, message, ago, opacity: 0, translateY: 20 };
    setToasts(prev => [...prev, newToast]);

    if (!props.demo) {
      setShowCount(prev => prev + 1);
      setCounterAnimate(true);
      setTimeout(() => setCounterAnimate(false), 300);
    } else {
      setShowCount(prev => prev + 1);
      setCounterAnimate(true);
      setTimeout(() => setCounterAnimate(false), 300);
    }

    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, opacity: 1, translateY: 0 } : t));
    }, 50);

    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, opacity: 0, translateY: -20 } : t));
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 300);
    }, props.displayMs);
  };

  const scheduleNext = () => {
    if (!isPlaying) return;
    const delay = randomBetween(props.minInterval, props.maxInterval);
    timerRef.current = setTimeout(() => {
      showNotification();
      scheduleNext();
    }, delay);
  };

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToasts([]);
    setShowCount(0);
    setIsClosed(false);
    setHasConsent(!props.requireConsent);
    toastIdRef.current = 0;

    if (isPlaying) {
      if (props.demo) {
        showNotification();
      }
      scheduleNext();
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [
    props.demo,
    props.requireConsent,
    props.position,
    props.displayMs,
    props.minInterval,
    props.maxInterval,
    props.maxShows,
    props.respectSessionClose,
    props.themeBg,
    props.themeText,
    props.productName,
    props.productImg,
    props.messages,
    props.agoMin,
    props.agoMax,
    props.names,
    props.cities,
    isPlaying
  ]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleReload = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToasts([]);
    setShowCount(0);
    setCounterAnimate(false);
    setIsClosed(false);
    setHasConsent(!props.requireConsent);
    toastIdRef.current = 0;
    setIsPlaying(true);
  };

  const handleClear = () => {
    setToasts([]);
    setShowCount(0);
    setCounterAnimate(false);
  };

  const handleCloseToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    if (props.respectSessionClose) {
      setIsClosed(true);
      if (timerRef.current) clearTimeout(timerRef.current);
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Pré-visualização em Tempo Real</CardTitle>
          <div className="flex items-center gap-2">
            <span 
              className="text-sm text-muted-foreground transition-transform duration-300"
              style={{
                transform: counterAnimate ? 'scale(1.15)' : 'scale(1)',
                display: 'inline-block'
              }}
            >
              Notificações: {showCount}/{props.maxShows}
            </span>
            <Button variant="outline" size="sm" onClick={handlePlayPause}>
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button variant="outline" size="sm" onClick={handleReload}>
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleClear}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative bg-gray-100 dark:bg-gray-900 rounded-lg min-h-[300px] overflow-hidden flex items-center justify-center">
          {props.requireConsent && !hasConsent && (
            <div className="absolute top-0 left-0 right-0 bg-gray-800 text-white p-3 flex items-center justify-between z-20">
              <span className="text-sm">Aceitar Cookies para ver notificações</span>
              <Button size="sm" onClick={() => setHasConsent(true)} variant="secondary">
                Aceitar
              </Button>
            </div>
          )}

          <div
            className="flex flex-col gap-2 max-w-[320px] w-full"
            style={{
              position: toasts.length > 0 ? 'absolute' : 'static',
              bottom: toasts.length > 0 ? '20px' : 'auto',
              [props.position]: toasts.length > 0 ? '20px' : 'auto'
            }}
          >
            {toasts.map((toast) => (
              <div
                key={toast.id}
                style={{
                  background: props.themeBg,
                  color: props.themeText,
                  opacity: toast.opacity,
                  transform: `translateY(${toast.translateY}px)`,
                  transition: 'opacity 0.3s ease-out, transform 0.3s ease-out',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  padding: '12px 14px',
                  position: 'relative',
                  fontSize: '14px',
                }}
              >
                <button
                  onClick={() => handleCloseToast(toast.id)}
                  style={{
                    position: 'absolute',
                    top: '6px',
                    right: '6px',
                    background: 'transparent',
                    border: 'none',
                    color: props.themeText,
                    fontSize: '20px',
                    cursor: 'pointer',
                    width: '24px',
                    height: '24px',
                    lineHeight: '24px',
                    textAlign: 'center',
                  }}
                >
                  ×
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img
                    src={props.productImg}
                    alt={props.productName}
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '4px',
                      objectFit: 'cover',
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="48"%3E%3Crect fill="%23ddd" width="48" height="48"/%3E%3C/svg%3E';
                    }}
                  />
                  <div style={{ flex: 1, lineHeight: '1.4' }}>
                    <div style={{ fontWeight: 600, marginBottom: '4px' }}>{toast.name}</div>
                    <div style={{ opacity: 0.9 }}>{toast.message}</div>
                    <div style={{ opacity: 0.7, fontSize: '12px', marginTop: '4px' }}>
                      {toast.city} • {toast.ago} minute{toast.ago === 1 ? '' : 's'} ago
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
