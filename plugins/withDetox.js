// Local Expo config plugin wiring Detox into the generated Android project.
// Based on @config-plugins/detox (MIT), whose published version only declares Expo 53.
const fs = require('fs');
const path = require('path');
const {
  AndroidConfig,
  withAndroidManifest,
  withAppBuildGradle,
  withDangerousMod,
  withPlugins,
  withProjectBuildGradle,
} = require('expo/config-plugins');

const detoxMarker = '// @generated detox-maven';

const detoxMavenBlock = [
  detoxMarker,
  `def detoxMavenPath = new File(["node", "--print", "require.resolve('detox/package.json')"].execute(null, rootDir).text.trim(), "../Detox-android")`,
  'allprojects { repositories { maven { url(detoxMavenPath) } } }',
].join('\n');

function withDetoxMaven(config) {
  return withProjectBuildGradle(config, (gradleConfig) => {
    if (!gradleConfig.modResults.contents.includes(detoxMarker)) {
      gradleConfig.modResults.contents += `\n${detoxMavenBlock}\n`;
    }
    return gradleConfig;
  });
}

function addOnce(contents, marker, pattern, replacement) {
  return contents.includes(marker) ? contents : contents.replace(pattern, replacement);
}

function withDetoxAppGradle(config) {
  return withAppBuildGradle(config, (gradleConfig) => {
    let contents = gradleConfig.modResults.contents;
    contents = addOnce(
      contents,
      'com.wix:detox:+',
      /dependencies\s?{/,
      "dependencies {\n    androidTestImplementation('com.wix:detox:+')\n    implementation 'androidx.appcompat:appcompat:1.7.0'",
    );
    contents = addOnce(
      contents,
      'detox-default-config',
      /defaultConfig\s?{/,
      "defaultConfig {\n        // detox-default-config\n        testBuildType System.getProperty('testBuildType', 'debug')\n        testInstrumentationRunner 'androidx.test.runner.AndroidJUnitRunner'",
    );
    gradleConfig.modResults.contents = contents;
    return gradleConfig;
  });
}

function detoxTestClass(androidPackage) {
  return `package ${androidPackage};

import com.wix.detox.Detox;
import com.wix.detox.config.DetoxConfig;

import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;

import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.filters.LargeTest;
import androidx.test.rule.ActivityTestRule;

@RunWith(AndroidJUnit4.class)
@LargeTest
public class DetoxTest {
    @Rule
    public ActivityTestRule<MainActivity> mActivityRule = new ActivityTestRule<>(MainActivity.class, false, false);

    @Test
    public void runDetoxTests() {
        DetoxConfig detoxConfig = new DetoxConfig();
        detoxConfig.idlePolicyConfig.masterTimeoutSec = 90;
        detoxConfig.idlePolicyConfig.idleResourceTimeoutSec = 60;
        detoxConfig.rnContextLoadTimeoutSec = (${androidPackage}.BuildConfig.DEBUG ? 180 : 60);

        Detox.runTests(mActivityRule, detoxConfig);
    }
}
`;
}

// Detox talks to the app over ws://localhost (adb reverse); release builds block cleartext otherwise.
const networkSecurityConfig = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
  <domain-config cleartextTrafficPermitted="true">
    <domain includeSubdomains="true">10.0.2.2</domain>
    <domain includeSubdomains="true">localhost</domain>
  </domain-config>
</network-security-config>
`;

function withDetoxNativeFiles(config) {
  return withDangerousMod(config, [
    'android',
    async (modConfig) => {
      const androidPackage = modConfig.android?.package;
      if (!androidPackage) throw new Error('android.package must be defined for Detox');
      const root = modConfig.modRequest.platformProjectRoot;
      const testFolder = path.join(root, 'app/src/androidTest/java', ...androidPackage.split('.'));
      fs.mkdirSync(testFolder, { recursive: true });
      fs.writeFileSync(path.join(testFolder, 'DetoxTest.java'), detoxTestClass(androidPackage));
      const xmlFolder = path.join(root, 'app/src/main/res/xml');
      fs.mkdirSync(xmlFolder, { recursive: true });
      fs.writeFileSync(path.join(xmlFolder, 'network_security_config.xml'), networkSecurityConfig);
      return modConfig;
    },
  ]);
}

function withNetworkSecurityManifest(config) {
  return withAndroidManifest(config, (manifestConfig) => {
    const application = AndroidConfig.Manifest.getMainApplicationOrThrow(manifestConfig.modResults);
    application.$['android:networkSecurityConfig'] = '@xml/network_security_config';
    return manifestConfig;
  });
}

module.exports = function withDetox(config) {
  return withPlugins(config, [
    withDetoxMaven,
    withDetoxAppGradle,
    withDetoxNativeFiles,
    withNetworkSecurityManifest,
  ]);
};
