import * as React from 'react';
import MainLayout from "@Layouts/MainLayout";
import GuestLayout from "@Layouts/GuestLayout";
import AuthorizedLayout from '@Layouts/AuthorizedLayout';
import LoginPage from '@Pages/LoginPage';
import AppRoute from "@Components/shared/AppRoute";
import HomePage from '@Pages/HomePage';
import ExamplesPage from '@Pages/ExamplesPage';
import { Switch } from 'react-router-dom';
import NotFoundPage from '@Pages/NotFoundPage';
import BoardPage from './pages/BoardPage';

export const routes = <Switch>
    <AppRoute layout={GuestLayout} exact path="/login" component={LoginPage} />
    <AppRoute layout={AuthorizedLayout} exact path="/" component={HomePage} />
    <AppRoute layout={AuthorizedLayout} exact path="/example" component={ExamplesPage} />
    <AppRoute layout={MainLayout} exact path="/board" component={BoardPage} />
    <AppRoute layout={GuestLayout} component={NotFoundPage} statusCode={404} />
</Switch>;