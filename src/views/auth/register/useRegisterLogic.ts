/**
 * @file useRegisterLogic.ts
 * @description Email/password sign-up: validates with the backend rules, calls
 * `POST /api/auth/register`, then hands the email to the verify-email screen.
 */

'use client';

import { registerSchema, type RegisterFormValues } from '@/models/schemas/authSchema';
import { authRepo } from '@/repositories/authRepo';
import { yupResolver } from '@hookform/resolvers/yup';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  classifyAuthError,
  fieldErrorsOf,
  genericAuthErrorMessage,
  readRegisterDraft,
  saveRegisterDraft,
  useGoogleSignIn,
  useRedirectSignedIn,
  verifyEmailHref,
} from '../useAuthFlow';

const formFields = ['fullName', 'email', 'password'] as const;

/** `already-registered` renders its own message with a link to the login page. */
export type RegisterFormError = { kind: 'already-registered' } | { kind: 'message'; text: string };

export function useRegisterLogic(locale: string) {
  const router = useRouter();
  const google = useGoogleSignIn({ locale, text: 'signup_with' });
  const [formError, setFormError] = useState<RegisterFormError>();
  const [redirecting, setRedirecting] = useState(false);
  useRedirectSignedIn(locale);

  const form = useForm<RegisterFormValues>({
    resolver: yupResolver(registerSchema),
    mode: 'onTouched',
    defaultValues: { fullName: '', email: '', password: '' },
  });

  // "Đổi email" on the verify screen comes back here: restore name + email, never the password.
  useEffect(() => {
    const draft = readRegisterDraft();
    if (draft) form.reset({ ...draft, password: '' });
  }, [form]);

  const submit = form.handleSubmit(async ({ fullName, email, password }) => {
    setFormError(undefined);
    const input = { fullName: fullName.trim(), email: email.trim(), password };
    try {
      await authRepo.register(input);
    } catch (reason) {
      const kind = classifyAuthError(reason);
      if (kind === 'already-registered') {
        setFormError({ kind: 'already-registered' });
        return;
      }
      if (kind === 'validation') {
        const fieldErrors = fieldErrorsOf(reason);
        let mapped = false;
        formFields.forEach((field) => {
          if (fieldErrors[field]) {
            form.setError(field, { message: fieldErrors[field] });
            mapped = true;
          }
        });
        if (mapped) return;
      }
      setFormError({ kind: 'message', text: genericAuthErrorMessage(reason) });
      return;
    }
    saveRegisterDraft({ fullName: input.fullName, email: input.email });
    setRedirecting(true);
    router.push(verifyEmailHref(locale, input.email));
  });

  return {
    ...google,
    form,
    formError,
    loading: form.formState.isSubmitting || redirecting,
    submit,
  };
}
