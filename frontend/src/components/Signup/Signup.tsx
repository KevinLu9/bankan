import React from 'react';
import { useSignUp } from '@/hooks';
import AuthDialog from '../common/AuthDialog';
import { Routes } from '@/Router/AppRouter';
import ComponentContainer from '../common/ComponentContainer';
import { validateSignUp } from './utils';

const InnerSignup: React.FC = () => {
  const [signup, { isLoading, error }] = useSignUp();

  return (
    <AuthDialog
      title="Signup"
      submitText="Sign up"
      submitRoute={Routes.Profile}
      alternateText="Login instead"
      alternateRoute={Routes.Login}
      finishHandler={signup}
      isLoading={isLoading}
      error={error}
      validationHandler={validateSignUp}
    />
  );
};
export const Signup: React.FC = () => {
  return (
    <ComponentContainer>
      <InnerSignup />
    </ComponentContainer>
  );
};
