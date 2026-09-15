package com.deltax.ar;

import android.Manifest;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Bundle;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.camera.core.*;
import androidx.camera.lifecycle.ProcessCameraProvider;
import androidx.camera.view.PreviewView;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.google.common.util.concurrent.ListenableFuture;
import org.opencv.android.OpenCVLoader;
import org.opencv.android.Utils;
import org.opencv.core.*;
import org.opencv.features2d.*;
import org.opencv.imgproc.Imgproc;
import java.nio.ByteBuffer;
import java.util.*;
import java.util.concurrent.*;

public class MainActivity extends AppCompatActivity {
    private PreviewView preview; private AROverlayView overlay; private TextView status,logo;
    private final ExecutorService exec=Executors.newSingleThreadExecutor();
    private ORB orb;
    private final List<Mat> refs=new ArrayList<>();
    private long lastScan=0,lastHit=0; private int taps=0; private long tapStart=0;

    @Override public void onCreate(Bundle b){
        super.onCreate(b);
        setContentView(R.layout.activity_main);
        preview=findViewById(R.id.preview); overlay=findViewById(R.id.overlay); status=findViewById(R.id.status); logo=findViewById(R.id.logo);
        logo.setOnClickListener(v->{long n=System.currentTimeMillis();if(n-tapStart>1200){taps=0;tapStart=n;}if(++taps>=3){taps=0;showFallback();}});
        try {
            if(!OpenCVLoader.initLocal()) { status.setText("INICIALIZANDO CÁMARA…"); }
            orb=ORB.create(1200);
            loadRefs();
        } catch(Throwable e) {
            orb=null;
            status.setText("MODO CÁMARA · CONTROL MANUAL DISPONIBLE");
        }
        if(ContextCompat.checkSelfPermission(this,Manifest.permission.CAMERA)==PackageManager.PERMISSION_GRANTED) startCamera();
        else ActivityCompat.requestPermissions(this,new String[]{Manifest.permission.CAMERA},7);
    }

    private void loadRefs(){
        if(orb==null)return;
        int[] ids={R.drawable.marker1,R.drawable.marker2,R.drawable.marker3};
        for(int id:ids){
            Bitmap b=BitmapFactory.decodeResource(getResources(),id); if(b==null){refs.add(new Mat());continue;}
            Mat rgba=new Mat(),g=new Mat(),d=new Mat(); MatOfKeyPoint kp=new MatOfKeyPoint();
            Utils.bitmapToMat(b,rgba); Imgproc.cvtColor(rgba,g,Imgproc.COLOR_RGBA2GRAY); orb.detectAndCompute(g,new Mat(),kp,d); refs.add(d);
            rgba.release();g.release();kp.release();b.recycle();
        }
    }

    private void startCamera(){
        ListenableFuture<ProcessCameraProvider> f=ProcessCameraProvider.getInstance(this);
        f.addListener(()->{try{ProcessCameraProvider cp=f.get();Preview pv=new Preview.Builder().build();pv.setSurfaceProvider(preview.getSurfaceProvider());ImageAnalysis ia=new ImageAnalysis.Builder().setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST).build();ia.setAnalyzer(exec,this::analyze);cp.unbindAll();cp.bindToLifecycle(this,CameraSelector.DEFAULT_BACK_CAMERA,pv,ia);}catch(Throwable e){runOnUiThread(()->status.setText("CÁMARA NO DISPONIBLE · TOCA ΔX 3 VECES"));}},ContextCompat.getMainExecutor(this));
    }

    private void analyze(@NonNull ImageProxy im){
        try{
            if(orb==null||refs.isEmpty())return;
            long now=System.currentTimeMillis();if(now-lastScan<450)return;lastScan=now;
            ImageProxy.PlaneProxy y=im.getPlanes()[0];ByteBuffer buf=y.getBuffer();int w=im.getWidth(),h=im.getHeight(),stride=y.getRowStride();
            byte[] src=new byte[buf.remaining()];buf.get(src);byte[] tight=new byte[w*h];
            for(int r=0;r<h;r++){int off=r*stride;if(off+w<=src.length)System.arraycopy(src,off,tight,r*w,w);}
            Mat frame=new Mat(h,w,CvType.CV_8UC1);frame.put(0,0,tight);MatOfKeyPoint kp=new MatOfKeyPoint();Mat desc=new Mat();orb.detectAndCompute(frame,new Mat(),kp,desc);
            if(desc.empty()){frame.release();kp.release();desc.release();return;}
            int best=-1,bestScore=0;BFMatcher matcher=BFMatcher.create(Core.NORM_HAMMING,false);
            for(int i=0;i<refs.size();i++){if(refs.get(i).empty())continue;List<MatOfDMatch> knn=new ArrayList<>();matcher.knnMatch(refs.get(i),desc,knn,2);int good=0;for(MatOfDMatch mm:knn){DMatch[] m=mm.toArray();if(m.length>=2&&m[0].distance<0.72f*m[1].distance)good++;mm.release();}if(good>bestScore){bestScore=good;best=i;}}
            if(bestScore>=13&&now-lastHit>3500){lastHit=now;int scene=best+1;runOnUiThread(()->activate(scene));}
            frame.release();desc.release();kp.release();
        }catch(Throwable e){runOnUiThread(()->status.setText("ESCANEO ACTIVO · TOCA ΔX 3 VECES PARA CONTROL MANUAL"));}
        finally{im.close();}
    }

    private void activate(int s){status.setText(s==1?"VALOR INVISIBLE DETECTADO":s==2?"EVIDENCIA DE CAMPO DETECTADA":"VALOR AMBIENTAL DETECTADO");overlay.showScene(s);overlay.postDelayed(()->{overlay.clearScene();status.setText("APUNTA A UNA LÁMINA DELTAX");},6500);}
    private void showFallback(){final String[] o={"1 · DESCUBRIR","2 · EVIDENCIA","3 · DAR VALOR"};new android.app.AlertDialog.Builder(this).setTitle("DeltaX · control manual").setItems(o,(d,w)->activate(w+1)).show();}
    @Override public void onRequestPermissionsResult(int r,@NonNull String[] p,@NonNull int[] g){super.onRequestPermissionsResult(r,p,g);if(r==7&&g.length>0&&g[0]==PackageManager.PERMISSION_GRANTED)startCamera();else status.setText("SE REQUIERE PERMISO DE CÁMARA");}
    @Override protected void onDestroy(){super.onDestroy();exec.shutdown();for(Mat m:refs)m.release();}
}
