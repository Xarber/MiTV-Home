// SPDX-License-Identifier: AGPL-3.0-only
package it.xarber.tvhome;
import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;
import java.util.List;
import java.util.Collections;
public final class AureaTVPackage implements ReactPackage {
    @Override public List<NativeModule> createNativeModules(ReactApplicationContext context){return Collections.singletonList(new AureaTVModule(context));}
    @Override public List<ViewManager> createViewManagers(ReactApplicationContext context){return Collections.emptyList();}
}
