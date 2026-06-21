export default function GameInstructions({ lang }) {
  const isFa = lang === 'fa';

  return (
    <div className="mx-auto" style={{ maxWidth: 620, padding: '40px 16px' }}>
      <h4 className="mb-4">{isFa ? 'راهنمای بازی' : 'How to Play'}</h4>
      <ol className="mb-4" style={{ lineHeight: 2.2, paddingLeft: 20 }}>
        {isFa ? (
          <>
            <li>پس از ورود، دکمه <strong>Ready</strong> را فشار دهید.</li>
            <li>ایستگاه مبدا و مقصد به شما نشان داده می‌شود.</li>
            <li>در مدت زمان مشخص، بخش‌های خط مترو را برای تشکیل مسیر انتخاب کنید.</li>
            <li>تنها در ایستگاه‌های تبادل می‌توانید خط را عوض کنید.</li>
            <li>مسیر را تایید کنید تا امتیاز خود را ببینید.</li>
            <li>رویدادهای تصادفی امتیاز شما را تغییر می‌دهند!</li>
          </>
        ) : (
          <>
            <li>Log in and press <strong>Ready</strong> to start a round.</li>
            <li>You'll be given a <strong>start</strong> and a <strong>destination</strong> station.</li>
            <li>Within the time limit, select metro segments that form a valid route.</li>
            <li>Line changes are only allowed at <strong>interchange stations</strong>.</li>
            <li>Press <strong>Validate</strong> to submit and see your score.</li>
            <li>Random events along your route can add or subtract points — good luck!</li>
          </>
        )}
      </ol>
      <div
        className="p-3 rounded"
        style={{ background: 'rgba(13,110,253,0.07)', border: '1px solid rgba(13,110,253,0.2)' }}
      >
        <strong>{isFa ? 'برای شروع بازی لطفاً وارد شوید.' : 'Please log in or register to start playing.'}</strong>
      </div>
    </div>
  );
}