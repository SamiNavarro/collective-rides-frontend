'use client';

interface PasswordValidatorProps {
  password: string;
  className?: string;
}

export function PasswordValidator({ password, className = '' }: PasswordValidatorProps) {
  const requirements = [
    {
      label: 'At least 8 characters',
      test: (pwd: string) => pwd.length >= 8,
    },
    {
      label: 'Contains uppercase letter (A-Z)',
      test: (pwd: string) => /[A-Z]/.test(pwd),
    },
    {
      label: 'Contains lowercase letter (a-z)',
      test: (pwd: string) => /[a-z]/.test(pwd),
    },
    {
      label: 'Contains digit (0-9)',
      test: (pwd: string) => /\d/.test(pwd),
    },
  ];

  const allValid = requirements.every(req => req.test(password));

  return (
    <div className={`text-xs space-y-1 ${className}`}>
      <div className={`font-medium ${allValid ? 'text-green-600' : 'text-gray-600'}`}>
        Password Requirements:
      </div>
      {requirements.map((req, index) => {
        const isValid = req.test(password);
        return (
          <div
            key={index}
            className={`flex items-center gap-1 ${
              isValid ? 'text-green-600' : 'text-gray-500'
            }`}
          >
            <span className="text-xs">
              {isValid ? '✅' : '⭕'}
            </span>
            <span>{req.label}</span>
          </div>
        );
      })}
    </div>
  );
}