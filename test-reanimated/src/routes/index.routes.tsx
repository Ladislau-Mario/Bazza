import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import SplashScreen from '../pages/auth/splash/splash';
import Onboarding from '../pages/auth/onboarding/onboarding';
import InputPhoneNumber from '../pages/auth/withNumber/withNumber';
import VerifycationNumber from '../pages/auth/verifycationNumer/verification';
import ClientRegister from '../pages/client/clientRegister/clientRegister/clientRegister';
import ChoiceMode from '../pages/auth/UserMode/userMode';
import DeliverRegister from '../pages/deliver/deliverRegister/screenOne/one';
import DeliverRegisterTwo from '../pages/deliver/deliverRegister/screenTwo/two';
import DeliverRegisterThree from '../pages/deliver/deliverRegister/screenThree/three';
import DeliverRegisterFour from '../pages/deliver/deliverRegister/screenFour/four';
import ClientRegisterEmail from '../pages/client/clientRegister/clientRegisterEmail/clientRegisterEmail';
import LocationPermission from '../pages/client/locationPermission/clientPermission';
import FirstRegistrationStatus from '../pages/deliver/registrationStatus/firstRegisterStatus/firstRegisterStatus';
import SecundRegistrationStatus from '../pages/deliver/registrationStatus/secundRegisterStatus/secundRegisterStatus';
import ThirdRegistrationStatus from '../pages/deliver/registrationStatus/thirdRegisterStatus/thirdRegisterStatus';
import AccessConfig from '../pages/deliver/deliverPermission/deliverPermission';
import DeliverNotifications from '../pages/deliver/mainDeliver/notification';
import DeliverHistory from '../pages/deliver/mainDeliver/history';
import PendingApproval from '../pages/deliver/pendingApproval/pendingApproval';
import Suspended from '../pages/deliver/suspended/suspended';

import BottomRoutes from './bottom.routes';
import DeliverRoutes from './deliver.routes';

// ✅ Página de Planos (index.tsx da pasta plans)
import Plans from '../pages/deliver/mainDeliver/plans';
import DeliverSupport from '../pages/deliver/mainDeliver/support';
import DeliverSettings from '../pages/deliver/mainDeliver/settings';
import DeliverDocuments from '../pages/deliver/mainDeliver/documents';

const Stack = createStackNavigator();

export default function Routes() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        gestureDirection: 'horizontal',
        cardStyleInterpolator: ({ current, layouts }) => ({
          cardStyle: {
            transform: [
              {
                translateX: current.progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [layouts.screen.width, 0],
                }),
              },
            ],
          },
        }),
      }}
    >
      {/* Splash verifica sessão e redireciona */}
      <Stack.Screen name="SplashScreen" component={SplashScreen} />
      <Stack.Screen name="ClientHome" component={BottomRoutes} />
      <Stack.Screen name="DeliverHomeTab" component={DeliverRoutes} />
      <Stack.Screen name="Onboarding" component={Onboarding} />

      <Stack.Screen name="ClientRegisterEmail" component={ClientRegisterEmail} />

      {/* ✅ Plans — sobe de baixo como modal */}
      <Stack.Screen
        name="Plans"
        component={Plans}
        options={{
          gestureDirection: 'vertical',
          cardStyleInterpolator: ({ current, layouts }) => ({
            cardStyle: {
              transform: [
                {
                  translateY: current.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [layouts.screen.height, 0],
                  }),
                },
              ],
            },
          }),
        }}
      />

      <Stack.Screen name="DeliverNotifications" component={DeliverNotifications} />
      <Stack.Screen name="DeliverSupport" component={DeliverSupport} />
      <Stack.Screen name="DeliverSettings" component={DeliverSettings} />
      <Stack.Screen name="DeliverDocuments" component={DeliverDocuments} />
      <Stack.Screen name="DeliverHistory" component={DeliverHistory} />
      <Stack.Screen name="InputPhoneNumber" component={InputPhoneNumber} />
      <Stack.Screen name="VerifycationNumber" component={VerifycationNumber} />
      <Stack.Screen name="ChoiceMode" component={ChoiceMode} />
      <Stack.Screen name="ClientRegister" component={ClientRegister} />
      <Stack.Screen name="LocationPermission" component={LocationPermission} />
      <Stack.Screen name="DeliverRegister" component={DeliverRegister} />
      <Stack.Screen name="DeliverRegisterTwo" component={DeliverRegisterTwo} />
      <Stack.Screen name="DeliverRegisterThree" component={DeliverRegisterThree} />
      <Stack.Screen name="DeliverRegisterFour" component={DeliverRegisterFour} />
      <Stack.Screen name="FirstRegistrationStatus" component={FirstRegistrationStatus} />
      <Stack.Screen name="SecundRegistrationStatus" component={SecundRegistrationStatus} />
      <Stack.Screen name="ThirdRegistrationStatus" component={ThirdRegistrationStatus} />
      <Stack.Screen name="AccessConfig" component={AccessConfig} />
      <Stack.Screen name="PendingApproval" component={PendingApproval} />
      <Stack.Screen name="Suspended" component={Suspended} />
    </Stack.Navigator>
  );
}