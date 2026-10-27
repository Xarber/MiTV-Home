// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Xarber
package it.xarber.tvhome;

import android.content.Context;
import android.graphics.*;
import android.os.SystemClock;
import android.view.*;
import android.widget.*;

/** Bounded TV popup: native scroll/focus, explicit overflow cues and small live software-blurred edges. */
final class PopupViewport extends FrameLayout {
    private final TvScroll scroll;
    private final Edges edges;
    private final int maximumHeight;
    private boolean scheduled;
    private long capturedAt;
    private final Runnable refresh=new Runnable(){public void run(){scheduled=false;if(!isAttachedToWindow())return;edges.capture();capturedAt=SystemClock.uptimeMillis();}};
    PopupViewport(Context context,LinearLayout rows,int maximumHeight){
        super(context);this.maximumHeight=maximumHeight;
        scroll=new TvScroll(context);scroll.setVerticalScrollBarEnabled(false);scroll.setHorizontalScrollBarEnabled(false);
        scroll.setClipToPadding(false);scroll.setPadding(0,0,0,dp(18));scroll.setFadingEdgeLength(dp(24));scroll.setVerticalFadingEdgeEnabled(true);
        scroll.addView(rows,new ScrollView.LayoutParams(-1,-2));addView(scroll,new FrameLayout.LayoutParams(-1,-2));
        edges=new Edges(context);edges.setImportantForAccessibility(View.IMPORTANT_FOR_ACCESSIBILITY_NO);edges.setFocusable(false);edges.setClickable(false);
        addView(edges,new FrameLayout.LayoutParams(-1,-1));
        setClipToOutline(true);setOutlineProvider(ViewOutlineProvider.BACKGROUND);
        scroll.setOnScrollChangeListener((view,x,y,ox,oy)->schedule());rows.addOnLayoutChangeListener((v,l,t,r,b,ol,ot,or,ob)->schedule());
    }
    private int dp(float value){return Math.round(value*getResources().getDisplayMetrics().density);}
    @Override protected void onMeasure(int width,int height){super.onMeasure(width,MeasureSpec.makeMeasureSpec(maximumHeight,MeasureSpec.AT_MOST));}
    @Override protected void onSizeChanged(int w,int h,int oldW,int oldH){super.onSizeChanged(w,h,oldW,oldH);schedule();}
    @Override protected void onAttachedToWindow(){super.onAttachedToWindow();schedule();}
    @Override protected void onDetachedFromWindow(){removeCallbacks(refresh);scheduled=false;edges.release();super.onDetachedFromWindow();}
    private void schedule(){edges.invalidate();if(scheduled)return;scheduled=true;postDelayed(refresh,Math.max(0,50-(SystemClock.uptimeMillis()-capturedAt)));}
    static void prepareFocusableText(ViewGroup group){
        for(int i=0;i<group.getChildCount();i++){
            View child=group.getChildAt(i);
            if(child instanceof ViewGroup)prepareFocusableText((ViewGroup)child);
            else if(child instanceof TextView&&!(child instanceof EditText)&&!child.hasOnClickListeners()&&((TextView)child).length()>180){child.setFocusable(true);child.setFocusableInTouchMode(true);}
        }
    }
    private final class TvScroll extends ScrollView {
        TvScroll(Context context){super(context);}
        @Override public boolean requestChildRectangleOnScreen(View child,Rect rectangle,boolean immediate){
            Rect target=new Rect(rectangle);
            if(child instanceof TextView&&!(child instanceof EditText)&&!child.hasOnClickListeners()&&target.height()>getHeight()-dp(56)){target.top=0;target.bottom=dp(80);}
            target.top-=dp(24);target.bottom+=dp(28);
            return super.requestChildRectangleOnScreen(child,target,immediate);
        }
        @Override public boolean dispatchKeyEvent(KeyEvent event){
            View focused=findFocus();int code=event.getKeyCode();
            boolean wall=focused instanceof TextView&&!(focused instanceof EditText)&&!focused.hasOnClickListeners()&&focused.getHeight()>getHeight()-dp(56);
            if(wall&&(code==KeyEvent.KEYCODE_DPAD_UP||code==KeyEvent.KEYCODE_DPAD_DOWN)){
                int direction=code==KeyEvent.KEYCODE_DPAD_UP?-1:1;
                if(canScrollVertically(direction)){
                    if(event.getAction()==KeyEvent.ACTION_DOWN)scrollBy(0,direction*dp(60));
                    return true;
                }
                if(event.getAction()==KeyEvent.ACTION_DOWN){View next=focused.focusSearch(direction<0?View.FOCUS_UP:View.FOCUS_DOWN);if(next!=null&&next!=focused)next.requestFocus();}
                return true;
            }
            return super.dispatchKeyEvent(event);
        }
    }
    private final class Edges extends View {
        private final Paint paint=new Paint(Paint.ANTI_ALIAS_FLAG|Paint.FILTER_BITMAP_FLAG);
        private Bitmap top,bottom;
        private boolean above,below;
        Edges(Context context){super(context);}
        @Override protected void onMeasure(int width,int height){setMeasuredDimension(MeasureSpec.getSize(width),MeasureSpec.getMode(height)==MeasureSpec.EXACTLY?MeasureSpec.getSize(height):0);}
        void capture(){
            if(getWidth()<1||getHeight()<1)return;
            above=scroll.canScrollVertically(-1);below=scroll.canScrollVertically(1);
            if(above)top=strip(top,0);else{if(top!=null)top.recycle();top=null;}
            if(below)bottom=strip(bottom,getHeight()-dp(30));else{if(bottom!=null)bottom.recycle();bottom=null;}
            invalidate();
        }
        private Bitmap strip(Bitmap bitmap,int start){
            int width=Math.max(1,getWidth()/4),height=Math.max(1,dp(30)/4);
            if(bitmap==null||bitmap.getWidth()!=width||bitmap.getHeight()!=height){if(bitmap!=null)bitmap.recycle();bitmap=Bitmap.createBitmap(width,height,Bitmap.Config.ARGB_8888);}
            bitmap.eraseColor(Color.TRANSPARENT);Canvas snapshot=new Canvas(bitmap);snapshot.scale(width/(float)getWidth(),height/(float)dp(30));snapshot.translate(0,-start);scroll.draw(snapshot);
            int[] source=new int[width*height],blurred=new int[width*height];bitmap.getPixels(source,0,width,0,0,width,height);
            for(int pass=0;pass<2;pass++){
                for(int y=0;y<height;y++)for(int x=0;x<width;x++){
                    int a=0,r=0,g=0,b=0;
                    for(int dy=-1;dy<=1;dy++)for(int dx=-1;dx<=1;dx++){int color=source[Math.max(0,Math.min(height-1,y+dy))*width+Math.max(0,Math.min(width-1,x+dx))];a+=Color.alpha(color);r+=Color.red(color);g+=Color.green(color);b+=Color.blue(color);}
                    blurred[y*width+x]=Color.argb(a/9,r/9,g/9,b/9);
                }
                int[] swap=source;source=blurred;blurred=swap;
            }
            bitmap.setPixels(source,0,width,0,0,width,height);return bitmap;
        }
        @Override protected void onDraw(Canvas canvas){
            boolean up=scroll.canScrollVertically(-1),down=scroll.canScrollVertically(1);
            if(up)drawEdge(canvas,top,0,true);if(down)drawEdge(canvas,bottom,getHeight()-dp(30),false);
            paint.setShader(null);paint.setXfermode(null);paint.setStyle(Paint.Style.STROKE);paint.setColor(0xc0e6eaf0);paint.setStrokeWidth(dp(1.5f));paint.setStrokeCap(Paint.Cap.ROUND);paint.setStrokeJoin(Paint.Join.ROUND);
            if(up)chevron(canvas,dp(10),true);if(down)chevron(canvas,getHeight()-dp(10),false);
            paint.setStyle(Paint.Style.FILL);
        }
        private void drawEdge(Canvas canvas,Bitmap bitmap,int y,boolean upward){
            if(bitmap==null||bitmap.isRecycled())return;
            RectF region=new RectF(0,y,getWidth(),y+dp(30));int layer=canvas.saveLayer(region,null);
            paint.setStyle(Paint.Style.FILL);paint.setColor(Color.WHITE);paint.setShader(null);paint.setXfermode(null);canvas.drawBitmap(bitmap,null,region,paint);
            paint.setShader(new LinearGradient(0,region.top,0,region.bottom,upward?0xe0ffffff:0x00ffffff,upward?0x00ffffff:0xe0ffffff,Shader.TileMode.CLAMP));paint.setXfermode(new PorterDuffXfermode(PorterDuff.Mode.DST_IN));canvas.drawRect(region,paint);
            paint.setXfermode(null);paint.setShader(null);canvas.restoreToCount(layer);
        }
        private void chevron(Canvas canvas,float y,boolean up){float x=getWidth()/2f,d=dp(3);Path path=new Path();path.moveTo(x-d,y+(up?d:-d));path.lineTo(x,y);path.lineTo(x+d,y+(up?d:-d));canvas.drawPath(path,paint);}
        void release(){if(top!=null)top.recycle();if(bottom!=null)bottom.recycle();top=bottom=null;}
    }
}
