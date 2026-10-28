// SPDX-License-Identifier: AGPL-3.0-only
package it.xarber.tvhome;

import android.graphics.Canvas;
import android.graphics.ColorFilter;
import android.graphics.LinearGradient;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.PixelFormat;
import android.graphics.Shader;
import android.graphics.drawable.Drawable;
import android.os.SystemClock;

/** Original vector wallpapers; no decoded frames, network assets or blur cache. */
final class WallpaperArt extends Drawable {
    static final String[] IDS={"classic","silk","dune","tide","ink","aurora"};
    static final String[] LABELS={"Classic","Silk","Dune","Tide","Ink","Aurora"};
    private final String id;
    private final boolean motion;
    private final Paint paint=new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Path path=new Path();
    WallpaperArt(String id,boolean motion){this.id=id;this.motion=motion;}
    static boolean valid(String id){for(String value:IDS)if(value.equals(id))return true;return false;}
    private int[] colors(){switch(id){
        case "dune":return new int[]{0xff2c2022,0xffb09278,0xff483e48};
        case "tide":return new int[]{0xff0b222b,0xff668d91,0xff183d47};
        case "ink":return new int[]{0xff080a10,0xff30333e,0xff10131c};
        case "aurora":return new int[]{0xff151426,0xff6b739f,0xff29334e};
        default:return new int[]{0xff111b2c,0xff778ba1,0xff23344e};
    }}
    @Override public void draw(Canvas canvas){
        int[] c=colors();int save=canvas.save();canvas.translate(getBounds().left,getBounds().top);
        float w=getBounds().width(),h=getBounds().height();if(w<=0||h<=0){canvas.restoreToCount(save);return;}
        paint.setShader(new LinearGradient(0,0,w,h,c,null,Shader.TileMode.CLAMP));canvas.drawRect(0,0,w,h,paint);
        canvas.scale(w/1440f,h/900f);
        if(motion){double phase=SystemClock.elapsedRealtime()%48000/48000.0*Math.PI*2;canvas.translate((float)(Math.sin(phase)*12),(float)(Math.cos(phase)*7));}
        paint.setShader(new LinearGradient(0,900,1100,0,new int[]{0x00111b2c,(c[1]&0xffffff)|0x44000000,0x00111b2c},null,Shader.TileMode.CLAMP));
        path.reset();path.moveTo(-200,1100);path.cubicTo(150,930,280,390,430,100);path.cubicTo(590,-210,1030,-190,1140,80);path.cubicTo(640,250,600,630,150,1050);path.close();canvas.drawPath(path,paint);
        path.reset();path.moveTo(440,1000);path.cubicTo(600,760,620,520,930,410);path.cubicTo(1100,350,1260,420,1570,180);path.lineTo(1600,1000);path.close();canvas.drawPath(path,paint);
        paint.setShader(null);canvas.restoreToCount(save);
    }
    @Override public void setAlpha(int alpha){paint.setAlpha(alpha);invalidateSelf();}
    @Override public void setColorFilter(ColorFilter filter){paint.setColorFilter(filter);invalidateSelf();}
    @Override public int getOpacity(){return PixelFormat.OPAQUE;}
    @Override public ConstantState getConstantState(){return new ConstantState(){public Drawable newDrawable(){return new WallpaperArt(id,motion);}public int getChangingConfigurations(){return 0;}};}
}
