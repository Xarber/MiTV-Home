// SPDX-License-Identifier: AGPL-3.0-only
import React,{useEffect,useRef,useCallback,useState} from 'react';
import {View,Text,Image,StyleSheet,useWindowDimensions,Platform,ScrollView,Pressable} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import Animated,{useAnimatedStyle,useSharedValue,withTiming,Easing,useReducedMotion} from 'react-native-reanimated';
import {usePreviewLauncher,useNativeLauncher} from './src/launcher/useLauncher';
import type {Launcher} from './src/launcher/types';
import {NativePanels} from './src/components/NativePanels';
import {InputMarks} from './src/components/InputMarks';
import {NativeAppImage} from './src/components/NativeAppImage';
import {NativeWaveform} from './src/components/NativeWaveform';
import {nativeFocus} from './src/platform/native/focus';
import {useTVScrollFocus} from './src/hooks/useTVScrollFocus';
import {useKeyboard,focusId} from './src/hooks/useKeyboard';
import {translator} from './src/model/i18n';
import {tracks} from './src/model/catalog';
import {Wallpaper} from './src/components/Wallpaper';
import {FocusButton} from './src/components/FocusButton';
import {Tile} from './src/components/Tile';
import {Icon} from './src/components/Icon';
import {Artwork,Waveform} from './src/components/Music';
import {Panels} from './src/components/Panels';
import {SlidingDetails} from './src/components/SlidingDetails';
import {anchorFor,Anchor} from './src/components/AnchoredPanel';
import {BlurTargetView} from 'expo-blur';
import {Glass,GlassTarget} from './src/components/Glass';
import './src/platform/bootstrap';

export function NativeTVHome(){const launcher=useNativeLauncher();return <LauncherView demo={launcher}/>;}
export default function PreviewTVHome(){const launcher=usePreviewLauncher();return <LauncherView demo={launcher}/>;}
function LauncherView({demo}:{demo:Launcher}){
 const inputsScroll=useRef<React.ComponentRef<typeof ScrollView>>(null),appsScroll=useRef<React.ComponentRef<typeof ScrollView>>(null);const inputOffset=useTVScrollFocus(inputsScroll,'page-1'),appOffset=useTVScrollFocus(appsScroll,'page-2');
 const target=useRef<React.ComponentRef<typeof View>|null>(null);const {catalog,entry}=demo;const t=translator(demo.prefs.language);const {width,height}=useWindowDimensions();const compact=width<800;const reduced=useReducedMotion();const [now,setNow]=useState(new Date());const [wifi,setWifi]=useState(false);const [musicHover,setMusicHover]=useState(false);const [remoteHover,setRemoteHover]=useState(false);
 const [showHints,setShowHints]=useState(!demo.native);
 useEffect(()=>{const timer=setTimeout(()=>setShowHints(false),5500);return()=>clearTimeout(timer);},[]);
 const previousPanel=useRef<string|null>(null);
 const canvasHeight=Math.max(520,height);const pageY=useSharedValue(0);const restore=useRef<string|null>(null);const modalWasOpen=useRef(false);const wheelLock=useRef(0);
 const changePage=useCallback((page:number)=>{demo.setPage(Math.max(0,Math.min(2,page)));setTimeout(()=>{if(demo.native)nativeFocus.measureGroup('page-'+page);focusId(page===0?`dock:${demo.selected}`:page===1?`input:${catalog.find(a=>a.category==='inputs')?.id??'live'}`:'tab-all');},340);},[demo.selected,catalog]);
 const [musicAnchor,setMusicAnchor]=useState<Anchor>({left:48,top:32,width:50,height:50});
 const [settingsAnchor,setSettingsAnchor]=useState<Anchor>({left:width-230,top:32,width:182,height:47});
 const openMusic=useCallback(()=>{setMusicAnchor(anchorFor('activity-music',{left:compact?22:48,top:32,width:50,height:50}));demo.setPanel('music');},[compact]);
 const control=useCallback(()=>{setSettingsAnchor(anchorFor('header-settings',{left:width-230,top:32,width:182,height:47}));demo.setPanel(p=>p==='control'?null:'control');},[width]);
 const launch=useCallback((id:string)=>{demo.setSelected(id);if(id==='inputs'){changePage(1);return;}if(id==='all'){changePage(2);return;}if(demo.native){if(id==='airplay'){demo.setPanel('airplay');return;}void demo.execute('launch',{id}).catch(()=>{});return;}if(id==='music'){demo.start();openMusic();return;}if(id==='photos'){demo.setPanel('wallpapers');return;}if(id==='settings'){control();return;}if(id==='remote'||id==='airplay'){demo.setPanel(id);return;}demo.setPanel(`launch:${id}`);},[changePage,openMusic,control,demo.native,demo.execute]);

 const menu=useCallback((id:string)=>{if(catalog.some(a=>a.id===id))demo.setPanel(`menu:${id}`);},[catalog]);
 useKeyboard({panel:demo.panel,close:demo.close,control,page:demo.page,changePage,menu,play:demo.toggle});
 useEffect(()=>{pageY.set(withTiming(-demo.page*canvasHeight,{duration:reduced?0:280,easing:Easing.bezier(.23,1,.32,1)}));},[demo.page,canvasHeight,reduced]);
 useEffect(()=>{if(Platform.OS!=='web')return;for(let page=0;page<3;page++){const element=document.getElementById(`launcher-page-${page}`);if(element){element.inert=page!==demo.page;element.setAttribute('aria-hidden',String(page!==demo.page));}}},[demo.page]);
 const stageStyle=useAnimatedStyle(()=>({transform:[{translateY:pageY.get()}]}));
 useEffect(()=>{const timer=setInterval(()=>setNow(new Date()),1000);return()=>clearInterval(timer);},[]);
 useEffect(()=>{if(demo.ready){const timer=setTimeout(()=>focusId(`dock:${demo.prefs.dock[0]}`),220);return()=>clearTimeout(timer);}},[demo.ready]);
 useEffect(()=>{if(!demo.native)return;if(demo.panel){if(!modalWasOpen.current){restore.current=nativeFocus.current;modalWasOpen.current=true;}previousPanel.current=demo.panel;const timer=setTimeout(()=>focusId(demo.panel==='music'?'music-play_pause':'panel-close'),100);return()=>clearTimeout(timer);}if(modalWasOpen.current){modalWasOpen.current=false;if(previousPanel.current==='music'&&nativeFocus.group!=='modal')return;const timer=setTimeout(()=>focusId(restore.current??`dock:${demo.selected}`),80);return()=>clearTimeout(timer);}},[demo.panel]);
 useEffect(()=>{
 if(Platform.OS!=='web')return;
 const scene=document.getElementById('launcher-scene');
 if(demo.panel){if(!modalWasOpen.current)restore.current=(document.activeElement as HTMLElement)?.dataset.nav??null;modalWasOpen.current=true;if(scene)scene.inert=demo.panel!=='music';previousPanel.current=demo.panel;const timer=setTimeout(()=>focusId(demo.panel==='music'?'music-1':'panel-close'),30);return()=>clearTimeout(timer);}
 if(scene)scene.inert=false;
 if(modalWasOpen.current){modalWasOpen.current=false;if(previousPanel.current==='music'&&(document.activeElement as HTMLElement)?.dataset.group!=='modal')return;const id=restore.current;const timer=setTimeout(()=>focusId(id??`dock:${demo.selected}`),30);return()=>clearTimeout(timer);}
 },[demo.panel]);
 useEffect(()=>{if(Platform.OS!=='web')return;
 const wheel=(e:WheelEvent)=>{if((e.target as Element)?.closest?.('#inputs-scroll,#apps-scroll'))return;if(demo.panel||e.ctrlKey||Math.abs(e.deltaY)<12)return;e.preventDefault();if(Date.now()-wheelLock.current<650)return;wheelLock.current=Date.now();changePage(demo.page+(e.deltaY>0?1:-1));};
 window.addEventListener('wheel',wheel,{passive:false});return()=>window.removeEventListener('wheel',wheel);
 },[demo.panel,demo.page,changePage]);
 const selected=entry(demo.selected);const time=now.toLocaleTimeString(demo.prefs.language==='it'?'it-IT':'en-GB',{hour:'2-digit',minute:'2-digit'});const date=now.toLocaleDateString(demo.prefs.language==='it'?'it-IT':'en-GB',{day:'2-digit',month:'2-digit',year:'2-digit'});
 const apps=catalog.filter(a=>a.category!=='inputs'&&a.id!=='all'&&a.id!=='inputs'&&(demo.filter==='all'||a.category===demo.filter));
 const nativeMusic=demo.snapshot?.music;
 if(demo.native&&!demo.ready)return <View style={[s.root,{alignItems:"center",justifyContent:"center",padding:40,gap:24}]}><Text style={s.pageTitle}>Aurea Home</Text><Text style={s.tabLabel}>{demo.error??t("Connecting…")}</Text><FocusButton id="loading-retry" group="modal" label={t("Retry")} onPress={demo.refresh}><Text style={s.tabLabel}>{t("Retry")}</Text></FocusButton></View>;
 return <GlassTarget.Provider value={target}><View style={[s.root,{height:canvasHeight,maxHeight:canvasHeight}]}>
 <BlurTargetView ref={target} style={StyleSheet.absoluteFill}>
 <Wallpaper id={demo.prefs.wallpaper} motion={demo.prefs.motion}/>

 <View style={[s.hero, {opacity:demo.page===0?1:.2}]} pointerEvents="none">
 <Animated.View key={selected.id} style={{alignItems:'center',gap:16,animationName:reduced?undefined:{from:{opacity:0,transform:[{scale:.96}]},to:{opacity:1,transform:[{scale:1}]}},animationDuration:230}}>
 {demo.native&&selected.kind==='app'?<View style={[StyleSheet.absoluteFill,{width:width,height:height}]}><NativeAppImage id={selected.id} hero fallback={<Icon name={selected.icon} size={90}/>}/></View>:demo.native?<InputMarks app={selected} hero/>:selected.id==='cinema'?<><Text style={s.heroBrand}>cinema<Text style={{fontWeight:'200'}}>+</Text></Text><Text style={s.heroTagline}>A world of stories.</Text></>:selected.id==='video'?<View style={[s.heroMark,{backgroundColor:'#ed2735'}]}><Icon name="play" size={70}/></View>:selected.id==='music'?<><Artwork size={150} track={demo.track}/><Text style={s.heroMusic}>{tracks[demo.track]!.album}</Text></>:<View style={[s.heroMark,{backgroundColor:'#ffffff09'}]}><Icon name={selected.icon} size={selected.category==='inputs'?76:86}/></View>}
 </Animated.View>
 </View>
 </BlurTargetView>
 <View nativeID="launcher-scene" style={{flex:1,overflow:'hidden'}}>
 {demo.page>0&&<View style={[StyleSheet.absoluteFill,s.libraryBlur]} pointerEvents="none"><Glass strong/></View>}
 <View style={[s.header,{paddingHorizontal:compact?22:48}]}>
 <View style={s.activities}>{(!demo.music&&!demo.remote)&&<Text style={s.wordmark}>aurea<Text style={{fontWeight:'300',color:'#d0d6e1'}}> home</Text></Text>}
 {demo.music&&<FocusButton id="activity-music" group="header" label="Music activity" onPress={openMusic} onSelect={()=>setMusicHover(true)} onDeselect={()=>setMusicHover(false)} style={[s.activity,{backgroundColor:demo.prefs.glass?'rgba(0,0,0,.90)':'transparent'}]}><View onPointerLeave={()=>setMusicHover(false)} style={[s.activityInner,{gap:0}]}>{demo.native?<NativeWaveform small playing={demo.playing} source={nativeMusic?.source} colors={nativeMusic?.colors}/>:<Waveform track={demo.track} playing={demo.playing} small/>}<SlidingDetails expanded={musicHover&&!compact} width={205}>{demo.native?(demo.artwork?<Image source={{uri:demo.artwork}} style={{width:27,height:27,borderRadius:9}}/>:<Icon name="music" size={23}/>):<Artwork track={demo.track} size={27}/>}<Text numberOfLines={1} style={s.activityTitle}>{demo.native?nativeMusic?.title||t("Music"):tracks[demo.track]!.title}</Text></SlidingDetails></View></FocusButton>}
 {demo.remote&&<FocusButton id="activity-remote" group="header" label={t('Remote connected')} onPress={()=>demo.setPanel('remote')} onSelect={()=>setRemoteHover(true)} onDeselect={()=>setRemoteHover(false)} style={[s.activity,{backgroundColor:demo.prefs.glass?'rgba(0,0,0,.90)':'transparent'}]}><View onPointerLeave={()=>setRemoteHover(false)} style={[s.activityInner,{gap:0}]}><Icon name="remote" size={22}/><SlidingDetails expanded={remoteHover&&!compact} width={140}><Text numberOfLines={1} style={s.activityTitle}>{t('Remote connected')}</Text></SlidingDetails></View></FocusButton>}
 </View>
 <View style={[s.headerRight,{gap:compact?7:12}]}><FocusButton id="header-wifi" group="header" label={t('Network')} onSelect={()=>setWifi(true)} onDeselect={()=>setWifi(false)} onPress={()=>demo.setPanel('network')} style={s.pill}><View style={[s.activityInner,{gap:0}]} onPointerLeave={()=>setWifi(false)}><Icon name="wifi" size={20}/><SlidingDetails expanded={wifi&&!compact} width={90}><Text numberOfLines={1} style={s.wifi}>{demo.native?demo.snapshot?.network.title||t(demo.snapshot?.network.connected?"Connected":"Offline"):"Aurea Wi-Fi"}</Text></SlidingDetails></View></FocusButton><FocusButton id="header-settings" group="header" label={t('Control Center')} onPress={control} style={[s.pill,{paddingHorizontal:compact?12:17}]}><Text style={s.time}>{time}</Text>{!compact&&<Text style={s.date}>{date}</Text>}<Icon name="settings" size={19}/></FocusButton></View>
 </View>
 <Animated.View style={[{position:'absolute',top:0,left:0,right:0,height:canvasHeight*3},stageStyle]} pointerEvents={demo.panel&&demo.panel!=='music'?'none':'auto'}>
 <View nativeID="launcher-page-0" style={[s.page,{height:canvasHeight,paddingHorizontal:compact?22:Math.max(48,width*.065)}]}>
 <View style={{flex:1}}/>
 <View style={s.homeHint}><Text style={s.selectedName}>{t(selected.name)}</Text><Text style={s.selectedHint}>{selected.subtitle??(selected.id==='inputs'?'Your devices, one home.':selected.id==='all'?'Everything, in one place.':showHints?'Press Enter to open · Hold Enter for options':'')}</Text></View>
 <View style={[s.dock,{gap:compact?8:17,padding:compact?10:18}]}>{demo.prefs.dock.map(id=><Tile native={demo.native} key={id} app={{...entry(id),name:t(entry(id).name)}} id={`dock:${id}`} group="page-0" onPress={()=>launch(id)} onSelect={()=>demo.setSelected(id)} onMenu={()=>menu(id)}/>)}</View>
 <Pressable testID="home-more-hint" accessible={false} focusable={false} tabIndex={-1} onPress={()=>changePage(1)} style={s.down}><Text style={s.downText}>{t('App library')}</Text><Icon name="chevron" size={15} color="#c9cfda"/></Pressable>
 </View>
 <View nativeID="launcher-page-1" style={[s.page,{height:canvasHeight,paddingHorizontal:compact?22:Math.max(48,width*.065),paddingTop:132}]}>
 <View style={s.pageHeading}><View><Text style={s.pageTitle}>{t('App library')}</Text></View></View>
 <Text style={[s.sectionLabel,{marginTop:46}]}>{t('Inputs & Live TV').toUpperCase()}</Text>
 <ScrollView ref={inputsScroll} onScroll={event=>inputOffset(event.nativeEvent.contentOffset.y)} scrollEventThrottle={48} nativeID="inputs-scroll" showsVerticalScrollIndicator={false} contentContainerStyle={{padding:8,paddingBottom:20}} style={{flex:1}}><View style={[s.inputGrid,{flexWrap:compact?'wrap':'nowrap'}]}>{catalog.filter(a=>a.category==='inputs').map(a=><Tile native={demo.native} key={a.id} app={a} id={`input:${a.id}`} group="page-1" wide onPress={()=>launch(a.id)} onSelect={()=>demo.setSelected(a.id)} onMenu={()=>menu(a.id)}/>)}</View></ScrollView>
 <Pressable testID="inputs-more-hint" accessible={false} focusable={false} tabIndex={-1} onPress={()=>changePage(2)} style={[s.down,{marginBottom:50}]}><Text style={s.downText}>{t('All apps')}</Text><Icon name="chevron" size={17}/></Pressable>
 </View>
 <View nativeID="launcher-page-2" style={[s.page,{height:canvasHeight,paddingHorizontal:compact?22:Math.max(48,width*.065),paddingTop:130}]}>
 <View style={s.pageHeading}><Text style={s.pageTitle}>{t('All apps')}</Text></View>
 <View style={s.tabs}>{(['all','system','casting'] as const).map((tab,i)=><FocusButton key={tab} id={`tab-${tab}`} group="page-2" label={t(['All apps','System apps','Casting'][i]!)} selected={demo.filter===tab} onPress={()=>demo.setFilter(tab)} style={[s.tab,demo.filter===tab&&s.activeTab]}><Text style={s.tabLabel}>{t(['All apps','System apps','Casting'][i]!)}</Text></FocusButton>)}</View>
 <ScrollView ref={appsScroll} onScroll={event=>appOffset(event.nativeEvent.contentOffset.y)} scrollEventThrottle={48} nativeID="apps-scroll" showsVerticalScrollIndicator={false} contentContainerStyle={{padding:8,paddingBottom:95}}><View style={s.appsGrid}>{apps.map(a=><View key={a.id} style={{width:compact?'30%':'15%',marginBottom:25}}><Tile native={demo.native} app={a} id={`app:${a.id}`} group="page-2" onPress={()=>launch(a.id)} onSelect={()=>demo.setSelected(a.id)} onMenu={()=>menu(a.id)}/><Text style={s.appCaption}>{t(a.name)}</Text></View>)}</View></ScrollView>
 </View>
 </Animated.View>
 <View style={s.pageDots} pointerEvents="none" accessibilityElementsHidden>{[0,1,2].map(page=><View key={page} style={{width:24,height:24,alignItems:'center',justifyContent:'center'}}><View style={{width:5,height:page===demo.page?20:5,borderRadius:5,backgroundColor:page===demo.page?'#fff':'#ffffff40'}}/></View>)}</View>

 </View>
 {showHints&&<Animated.View style={[s.footer,{animationName:{from:{opacity:0},to:{opacity:1}},animationDuration:180}]}><Text style={s.demoLabel}>AUREA HOME · WEB PREVIEW</Text><Text style={s.shortcuts}>{compact?'↑ ↓ ← → · Enter · Esc':'↑ ↓ ← → Navigate     ↵ Open     M App menu     C Control Center     Esc Back'}</Text></Animated.View>}

 {demo.notice!==''&&<View style={s.notice}><Text style={s.tabLabel}>{demo.notice}</Text></View>}
 {demo.native?<NativePanels demo={demo} t={t} launch={launch} musicAnchor={musicAnchor} settingsAnchor={settingsAnchor}/>:<Panels demo={demo} t={t} launch={launch} musicAnchor={musicAnchor} settingsAnchor={settingsAnchor}/>}
 </View></GlassTarget.Provider>;
}
const s=StyleSheet.create({root:{flex:1,backgroundColor:'#0a101c',overflow:'hidden',minHeight:520},hero:{...StyleSheet.absoluteFill,bottom:'20%',alignItems:'center',justifyContent:'center'},heroMark:{width:190,height:150,borderRadius:36,alignItems:'center',justifyContent:'center',boxShadow:'0 24px 90px #0002'},heroBrand:{fontSize:88,fontWeight:'700',letterSpacing:-5,color:'#fff'},heroTagline:{fontSize:20,color:'#e9e7e0',letterSpacing:1},heroMusic:{color:'#fff',fontSize:23,fontWeight:'500'},header:{position:'absolute',top:32,left:0,right:0,zIndex:3,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:15},activities:{flexDirection:'row',gap:10,alignItems:'center',flexShrink:1},wordmark:{color:'#fff',fontSize:20,fontWeight:'700',letterSpacing:-.7,marginRight:10},activity:{...Platform.select({web:{backdropFilter:'blur(24px)'} as object}),borderRadius:50,minHeight:50,minWidth:50,paddingHorizontal:12},activityInner:{flexDirection:'row',alignItems:'center',gap:11},musicDetails:{flexDirection:'row',alignItems:'center',gap:9,maxWidth:200},activityTitle:{flexShrink:1,fontSize:12,fontWeight:'700',color:'#fff'},headerRight:{flexDirection:'row',alignItems:'center'},pill:{flexDirection:'row',gap:12,borderRadius:50,backgroundColor:'#ffffff14',minHeight:47,paddingHorizontal:12,...Platform.select({web:{backdropFilter:'blur(20px)'} as object})},wifi:{fontSize:12,color:'#eef1f7'},time:{color:'#fff',fontSize:13,fontWeight:'600',fontVariant:['tabular-nums']},date:{color:'#b7c0d1',fontSize:13,fontWeight:'400',fontVariant:['tabular-nums']},page:{paddingBottom:50},homeHint:{alignItems:'center',gap:8,marginBottom:25},selectedName:{fontSize:19,fontWeight:'600',color:'#fff'},selectedHint:{fontSize:12,color:'#c9d0de'},dock:{flexDirection:'row',borderRadius:26,backgroundColor:'#ffffff17',borderWidth:1,borderColor:'#ffffff25',boxShadow:'0 20px 70px #0003',...Platform.select({web:{backdropFilter:'blur(28px) saturate(1.2)'} as object})},down:{alignSelf:'center',marginTop:16,flexDirection:'row',gap:8,paddingHorizontal:18,minHeight:33},downText:{color:'#ccd2dc',fontSize:11,fontWeight:'500'},pageHeading:{flexDirection:'row',alignItems:'flex-end',justifyContent:'space-between'},eyebrow:{fontSize:10,fontWeight:'600',letterSpacing:2.2,color:'#aab7c9',marginBottom:13},pageTitle:{fontSize:38,fontWeight:'600',letterSpacing:-1.4,color:'#fff'},pageIndex:{fontSize:11,color:'#98a5b9',letterSpacing:2},sectionLabel:{fontSize:10,color:'#c1c9d7',letterSpacing:2,fontWeight:'600',marginBottom:27},inputGrid:{flexDirection:'row',gap:24},tabs:{flexDirection:'row',gap:8,marginTop:30,marginBottom:26},tab:{paddingHorizontal:24,paddingVertical:10,borderRadius:30,backgroundColor:'#ffffff08'},activeTab:{backgroundColor:'#ffffff20'},tabLabel:{color:'#fff',fontSize:14,fontWeight:'500'},appsGrid:{flexDirection:'row',flexWrap:'wrap',gap:'2%'},appCaption:{fontSize:12,textAlign:'center',color:'#c4cddd',marginTop:12},muted:{color:'#a8b3c5'},libraryBlur:{backgroundColor:'#080c177a',...Platform.select({web:{backdropFilter:'blur(42px)'} as object})},pageDots:{position:'absolute',right:15,top:'48%',gap:5},footer:{position:'absolute',bottom:0,left:0,right:0,height:36,paddingHorizontal:24,flexDirection:'row',justifyContent:'space-between',alignItems:'center',borderTopWidth:1,borderTopColor:'#ffffff0c',backgroundColor:'#050a1390'},demoBadge:{flexDirection:'row',alignItems:'center',gap:7},greenDot:{width:5,height:5,borderRadius:4,backgroundColor:'#afc9ba'},demoLabel:{fontSize:9,color:'#9cabbf',letterSpacing:1},shortcuts:{fontSize:10,color:'#9eacbf'},notice:{position:'absolute',top:95,left:40,padding:20,borderRadius:20,backgroundColor:'#111a2e',zIndex:20}});
