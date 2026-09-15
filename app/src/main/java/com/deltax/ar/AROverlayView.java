package com.deltax.ar;

import android.content.Context;
import android.graphics.*;
import android.util.AttributeSet;
import android.view.View;

public class AROverlayView extends View {
    private final Paint p = new Paint(Paint.ANTI_ALIAS_FLAG);
    private int scene = 0; private long start = 0;
    public AROverlayView(Context c, AttributeSet a){ super(c,a); }
    public void showScene(int s){ scene=s; start=System.currentTimeMillis(); invalidate(); }
    public void clearScene(){ scene=0; invalidate(); }
    @Override protected void onDraw(Canvas c){ super.onDraw(c); if(scene==0)return;
        float w=getWidth(), h=getHeight(), t=(System.currentTimeMillis()-start)/1000f;
        p.setColor(Color.argb(185,17,28,24)); c.drawRoundRect(w*.07f,h*.20f,w*.93f,h*.80f,34,34,p);
        p.setTextAlign(Paint.Align.CENTER); p.setTypeface(Typeface.create("sans",Typeface.BOLD)); p.setColor(Color.rgb(217,180,91)); p.setTextSize(w*.065f);
        String title=scene==1?"DESCUBRIR":scene==2?"EVIDENCIA":"DAR VALOR"; c.drawText(title,w/2,h*.30f,p);
        p.setColor(Color.rgb(255,247,232)); p.setTextSize(w*.042f); p.setTypeface(Typeface.DEFAULT_BOLD);
        String[] a=scene==1?new String[]{"CO₂","SUELO","AGUA","PRÁCTICAS"}:scene==2?new String[]{"CAMPO","MRV","EXPEDIENTE AMBIENTAL","TRAZABILIDAD"}:new String[]{"tCO₂e","CRÉDITO DE CARBONO","MARKETPLACE","MERCADOS EN EL MUNDO"};
        for(int i=0;i<a.length;i++){ float y=h*(.40f+i*.09f); float pulse=(float)(1+.04*Math.sin(t*4+i)); p.setTextSize(w*.040f*pulse); c.drawText(a[i],w/2,y,p); }
        p.setStyle(Paint.Style.STROKE); p.setStrokeWidth(4); p.setColor(Color.rgb(217,180,91)); float r=w*(.10f+.02f*(float)Math.sin(t*3)); c.drawCircle(w/2,h*.69f,r,p); p.setStyle(Paint.Style.FILL);
        p.setTextSize(w*.034f); p.setColor(Color.WHITE); c.drawText(scene==1?"El valor ya está en el campo":scene==2?"Del trabajo a la evidencia":"Del dato al mundo",w/2,h*.705f,p);
        postInvalidateDelayed(33);
    }
}
